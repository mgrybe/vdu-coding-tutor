import React from 'react';
import { useParams } from "react-router-dom";
import RichTextField, { RichTextPreviewField } from './RichTextField';
import IdTokenContext from './IdTokenContext';
import { QUIZZES_URL } from './Urls';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import PreviewIcon from '@mui/icons-material/Preview';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

let COUNTER = 1;

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function AlertDialog(props) {
    const handleAgree = () => {
        if (props.onAgree) {
            props.onAgree();
        }
        props.onClose();
    };

    return (
        <div>
            <Dialog
                open={props.open}
                onClose={props.onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {props.title || "Default Title"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {props.description || "Default Description"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.onClose}>{props.disagreeText || "Disagree"}</Button>
                    <Button onClick={handleAgree} autoFocus>
                        {props.agreeText || "Agree"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

class ManageQuizz extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            action: 'CREATE',
            mode: 'EDIT',
            quizzId: null,
            version: '0',
            failed: false,
            dialog: {
                title: "Confirm action",
                description: "Please confirm your action",
                isDialogOpen: false,
                handleAgree: () => { },
            },
            title: {
                value: '',
                error: false,
                errorMessages: [],
                validators: [
                    (value) => !value && "Title is required"
                ]
            },
            passingScore: {
                value: 0,
                error: false,
                errorMessages: [],
                validators: [
                    (value) => !value && "Passing score is required",
                    (value) => (value !== parseFloat(value + '') + '') && "Passing score must be a number",
                    (value) => (parseFloat(value) > this.getTotalScore()) && "Passing score can not be bigger than total",
                    (value) => parseFloat(value) <= 0 && "Passing score must be bigger than zero"
                    // TODO: Validate that passing score can not be bigger than the total
                ]
            },
            questions: [

            ]
        }
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let quizzId = this.props.params.editQuizzId;

        if (quizzId) {
            this.setState({ quizzId: quizzId, action: 'EDIT' });
        } else {
            quizzId = this.props.params.copyQuizzId;

            if (quizzId) {
                this.setState({ action: 'COPY' });
            }
        }

        if (quizzId) {
            this.setState({ loading: true });

            fetch(QUIZZES_URL + "?quizzId=" + quizzId + "&detailLevel=FULL", {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('quizz', data);

                    // Querying while module is null or version is not bumped
                    this.queryUntil(quizzId, 5, (quizz) => quizz === null || parseInt(quizz.version) <= parseInt(this.state.version), () => {
                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState['title']['value'] = data['title'];
                            newState['passingScore']['value'] = data['passingScore'];

                            newState['questions'] = data.questions.map((question) => {
                                return this.createQuestion(
                                    question['question'],
                                    question['score'],
                                    question.options.map((option) => {
                                        return this.createOption(option['option'], option['correct']);
                                    })
                                );
                            });
                            //newState['submitted'] = true;
                            newState['loading'] = false;

                            console.log('hydrated quizz', newState);

                            return newState;
                        });
                    });
                })
                .catch((error) => {
                    console.error(`Module create error: ${error.message}`);

                    this.setState((prevState) => {
                        return { ...prevState, failed: true, loading: false };
                    });
                });
        }
    }

    getQuizz(quizzId) {
        return fetch(QUIZZES_URL + "?quizzId=" + quizzId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        });
    }

    queryUntil(quizzId, retries = 5, predicate, callback) {
        if (retries === 0) {
            console.log('failed');
            callback();
            return;
        }

        console.log('querying until');

        this.getQuizz(quizzId)
            .then(module => {
                console.log('Existing', this.state.module, 'New', module);

                if (predicate(module)) {
                    // If the resource was found, schedule the next attempt in 2 seconds
                    setTimeout(() => this.queryUntil(quizzId, retries - 1, predicate, callback), 2000);
                } else {
                    callback();
                }
            })
            .catch(response => {
                console.log('error', response);
                callback();
            });
    }

    onCreate(event) {
        event.preventDefault();

        const state = this.state;

        const quizz = {
            title: state.title.value,
            passingScore: state.passingScore.value,
        };

        if (state.quizzId) {
            quizz['id'] = state.quizzId;
        }

        quizz['questions'] = state.questions.map(question => {
            return {
                question: question.value,
                type: question.type,
                score: question.score.value,
                options: question.options.map(option => {
                    return {
                        option: option.value,
                        correct: option.correct
                    }
                })
            };
        });

        this.setState({ loading: true });

        fetch(QUIZZES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors',
            body: JSON.stringify(quizz)
        })
            .then(response => response.json())
            .then(quizz => {
                console.log('created', quizz);

                // Querying while module is null or version is not bumped
                this.queryUntil(quizz.id, 5, (quizz) => quizz === null || parseInt(quizz.version) <= parseInt(this.state.version), () => {
                    this.setState((prevState) => {
                        return { ...prevState, submitted: true, loading: false };
                    });
                });
            })
            .catch((error) => {
                console.error(`Quizz create error: ${error.message}`);

                this.setState((prevState) => {
                    return { ...prevState, failed: true, loading: false };
                });
            });

        console.log('on-create event', quizz);
    }

    validateField(value, fieldState) {
        const errorMessages = [];

        for (const validator of fieldState.validators) {
            const errorMessage = validator(value);
            if (errorMessage) {
                errorMessages.push(errorMessage);
                break;
            }
        }

        fieldState['value'] = value;
        fieldState['error'] = errorMessages.length > 0;
        fieldState['errorMessages'] = errorMessages;

        return fieldState;
    }

    getTotalScore() {
        return this.state.questions.reduce((acc, curr) => acc + parseFloat(curr.score.value), 0);
    }

    createQuestion(question, score, options) {
        return {
            __id: new Date().getTime() + '_' + (COUNTER++) + '',
            value: question || '',
            type: 'SINGLE',
            options: options || [],
            error: false,
            errorMessages: [],
            validators: [
                (value) => (!value || value.trim() === '<p></p>') && "Question is required"
            ],
            score: {
                value: score || 1,
                error: false,
                errorMessages: [],
                validators: [
                    (value) => !value && "Score is required",
                    (value) => (value !== parseFloat(value + '') + '') && "Score must be a number"
                ]
            },
        };
    }

    createOption(option, correct) {
        return {
            __id: new Date().getTime() + '_' + (COUNTER++) + '',
            id: '',
            value: option || '',
            correct: correct !== undefined ? correct : false,
            error: false,
            errorMessages: [],
            validators: [
                (value) => (!value || value.trim() === '<p></p>') && "Option is required"
            ]
        };
    }

    render() {

        const editForm = <Stack spacing={2} direction="column">
            <Paper elevation={5}>
                <Grid container spacing={0} justifyContent="center" alignItems="center">
                    <Grid item xs={12}>
                        <Stack spacing={2} direction="row" sx={{ p: 2 }}>
                            <TextField
                                required
                                value={this.state.title.value}
                                label="Quizz title"
                                onChange={(event) => {
                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        newState['title'] = this.validateField(event.target.value, newState['title']);

                                        return newState;
                                    });
                                }}
                                fullWidth

                                error={this.state.title.error}
                                helperText={this.state.title.errorMessages.join('\n')}
                            />

                            <TextField

                                disabled
                                value={this.getTotalScore()}
                                label="Total score"
                            />

                            <TextField
                                required
                                value={this.state.passingScore.value}
                                label="Passing score"
                                onChange={(event) => {
                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        newState['passingScore'] = this.validateField(event.target.value, newState['passingScore']);

                                        return newState;
                                    });
                                }}

                                error={this.state['passingScore'].error}
                                helperText={this.state['passingScore'].errorMessages.join('\n')}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {this.state.questions.map((question, index) => {
                return (
                    <div>
                        {/*<AlertDialog
                            open={this.state.dialog.isDialogOpen}
                            onClose={this.onHandleCloseDialog}
                            onAgree={this.state.dialog.handleAgree}
                            title={this.state.dialog.title}
                            description={this.state.dialog.description}
                            agreeText="Confirm"
                            disagreeText="Discard"
                />*/}
                        <Paper elevation={5} key={question['__id']}>
                            <Grid container spacing={0} justifyContent="center" alignItems="center">
                                <Grid item xs={12} sx={{ p: 2 }}>
                                    <Stack spacing={2} direction="row">
                                        <RichTextField
                                            value={question.value}
                                            required
                                            label="Question"
                                            id="outlined-start-adornment"
                                            sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                            onChange={(event) => {
                                                this.setState((prevState) => {
                                                    const newState = { ...prevState };

                                                    newState['questions'][index] = this.validateField(event.target.value, newState['questions'][index]);

                                                    return newState;
                                                });
                                            }}
                                            error={this.state['questions'][index].error}
                                            helperText={this.state['questions'][index].errorMessages.join('\n')}
                                        />

                                        <Stack spacing={2} direction="column">
                                            <IconButton color="primary" onClick={() => {
                                                this.setState((prevState) => {
                                                    const newState = { ...prevState };

                                                    newState['questions'].splice(index, 1);

                                                    return newState;
                                                });
                                            }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack spacing={2} direction="row" sx={{ paddingLeft: 3 }}>
                                        <TextField
                                            required
                                            value={question.score.value}
                                            label="Score"
                                            onChange={(event) => {
                                                this.setState((prevState) => {
                                                    const newState = { ...prevState };

                                                    newState['questions'][index]['score'] = this.validateField(event.target.value, newState['questions'][index]['score']);

                                                    return newState;
                                                });
                                            }}
                                            error={this.state['questions'][index].score.error}
                                            helperText={this.state['questions'][index].score.errorMessages.join('\n')}
                                        />
                                        <ToggleButtonGroup
                                            value={question.type}
                                            exclusive
                                            onChange={(event, value) => {
                                                if (value !== null) {
                                                    this.setState((prevState) => {
                                                        const newState = { ...prevState };

                                                        newState['questions'][index]['type'] = value;

                                                        for (const opt of newState['questions'][index]['options']) {
                                                            opt['correct'] = false;
                                                        }

                                                        return newState;
                                                    });
                                                }
                                            }}
                                            aria-label="text alignment"
                                        >
                                            <ToggleButton value="SINGLE" aria-label="left aligned">
                                                Single option
                                            </ToggleButton>

                                            <ToggleButton value="MULTI" aria-label="right aligned">
                                                Multi option
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </Stack>
                                </Grid>
                                {
                                    question.options.map((option, optionIndex) => {
                                        return (
                                            <Grid key={option['__id']} item xs={12} sx={{ p: 2, paddingTop: 3 }}>
                                                <Stack spacing={2} direction="row">
                                                    <Stack spacing={2} direction="column">
                                                        {question.type === 'SINGLE' &&
                                                            <Radio checked={option.correct} value="true" onChange={(event) => {
                                                                console.log('radio', event);

                                                                this.setState((prevState) => {
                                                                    const newState = { ...prevState };

                                                                    console.log('options', newState['questions'][index]['options']);

                                                                    for (const opt of newState['questions'][index]['options']) {
                                                                        opt['correct'] = false;
                                                                    }

                                                                    newState['questions'][index]['options'][optionIndex]['correct'] = event.target.value === 'true';

                                                                    return newState;
                                                                });
                                                            }} />
                                                        }
                                                        {question.type === 'MULTI' &&
                                                            <Checkbox checked={option.correct} value="true" onChange={(event) => {
                                                                this.setState((prevState) => {
                                                                    const newState = { ...prevState };

                                                                    newState['questions'][index]['options'][optionIndex]['correct'] = event.target.value === 'true';

                                                                    return newState;
                                                                });
                                                            }} />
                                                        }
                                                    </Stack>
                                                    <RichTextField
                                                        value={option.value}
                                                        required
                                                        label="Option"
                                                        id="outlined-start-adornment"
                                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                                        onChange={(event) => {
                                                            this.setState((prevState) => {
                                                                const newState = { ...prevState };

                                                                newState['questions'][index]['options'][optionIndex] = this.validateField(event.target.value, newState['questions'][index]['options'][optionIndex]);

                                                                return newState;
                                                            });
                                                        }}
                                                        error={this.state['questions'][index]['options'][optionIndex].error}
                                                        helperText={this.state['questions'][index]['options'][optionIndex].errorMessages.join('\n')}
                                                    />
                                                    <Stack spacing={2} direction="column">
                                                        <IconButton color="primary" onClick={() => {
                                                            this.setState((prevState) => {
                                                                const newState = { ...prevState };

                                                                newState['questions'][index]['options'].splice(optionIndex, 1);

                                                                return newState;
                                                            });
                                                        }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </Stack>
                                            </Grid>
                                        )
                                    })
                                }

                                <Grid item xs={12} sx={{ p: 2 }}>
                                    <Button variant="text"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            this.setState((prevState) => {
                                                const newState = { ...prevState };

                                                newState['questions'][index]['options'].push(this.createOption());

                                                return newState;
                                            });
                                        }}
                                    >Add option</Button>
                                </Grid>
                            </Grid>
                        </Paper >
                    </div>
                )
            })}
        </Stack>;

        const previewForm = <Stack spacing={2} direction="column">
            <Paper elevation={5}>
                <Grid container spacing={0} justifyContent="center" alignItems="center">
                    <Grid item xs={12} className="problem-right">
                        <TextField
                            value={this.state.title.value}
                            label="Quizz title"
                            id="outlined-start-adornment"
                            sx={{ m: 1, width: 'calc(100% - 16px)' }}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {this.state.questions.map((question, index) => {
                return (
                    <Paper elevation={5} key={question['__id']}>
                        <Grid container spacing={0} justifyContent="center" alignItems="center">
                            <Grid item xs={12}>
                                <Stack spacing={2} direction="row">
                                    <RichTextPreviewField
                                        value={question.value}
                                        required
                                        label="Question"
                                        id="outlined-start-adornment"
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Stack>
                            </Grid>
                            {
                                question.options.map((option, optionIndex) => {
                                    return (
                                        <Grid key={option['__id']} item xs={12} sx={{ p: 2 }}>
                                            <Stack spacing={2} direction="row">
                                                <Stack spacing={2} direction="column">
                                                    {question.type === 'SINGLE' &&
                                                        <Radio checked={option.correct} value="true" onChange={(event) => {
                                                            console.log('radio', event);

                                                            this.setState((prevState) => {
                                                                const newState = { ...prevState };

                                                                console.log('options', newState['questions'][index]['options']);

                                                                for (const opt of newState['questions'][index]['options']) {
                                                                    opt['correct'] = false;
                                                                }

                                                                newState['questions'][index]['options'][optionIndex]['correct'] = event.target.value === 'true';

                                                                return newState;
                                                            });
                                                        }} />
                                                    }
                                                    {question.type === 'MULTI' &&
                                                        <Checkbox checked={option.correct} value="true" onChange={(event) => {
                                                            this.setState((prevState) => {
                                                                const newState = { ...prevState };

                                                                newState['questions'][index]['options'][optionIndex]['correct'] = event.target.value === 'true';

                                                                return newState;
                                                            });
                                                        }} />
                                                    }
                                                </Stack>
                                                <RichTextPreviewField
                                                    value={option.value}
                                                    required
                                                    label="Option"
                                                    id="outlined-start-adornment"
                                                    sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                                />
                                            </Stack>
                                        </Grid>
                                    )
                                })
                            }
                        </Grid>
                    </Paper>
                )
            })}
        </Stack>;

        return (
            <>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={this.state.loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <Snackbar open={this.state.submitted} autoHideDuration={6000} onClose={() => this.setState({ submitted: false })}>
                    <Alert onClose={() => this.setState({ submitted: false })} severity="success" sx={{ width: '100%' }}>
                        Quizz submitted successfully!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
                    <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
                        Quizz submissions failed
                    </Alert>
                </Snackbar>
                <h1>Create quizz</h1>

                <form onSubmit={(event) => this.onCreate(event)}>
                    {this.state.mode === 'EDIT' ? editForm : previewForm}

                    <Grid container spacing={0} justifyContent="center" alignItems="center">
                        <Grid item xs={12} sx={{ p: 2 }}>
                            <Stack spacing={1} direction="row">
                                {this.state.mode === 'EDIT' && <Button
                                    variant="outlined"
                                    disabled={this.state.loading}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        console.log('add');

                                        this.setState((prevState) => {
                                            const newState = { ...prevState };

                                            newState['questions'].push(this.createQuestion());

                                            return newState;
                                        });
                                    }}
                                    startIcon={<AddIcon />}
                                >New question</Button>}

                                {this.state.mode === 'EDIT' && <Button variant="outlined" disabled={this.state.loading} onClick={(event) => {
                                    event.preventDefault();

                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        newState['mode'] = 'PREVIEW';

                                        console.log('previewState', newState);

                                        return newState;
                                    });
                                }} startIcon={<PreviewIcon />}>
                                    Preview
                                </Button>}

                                {this.state.mode === 'PREVIEW' && <Button variant="outlined" disabled={this.state.loading} onClick={(event) => {
                                    event.preventDefault();

                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        newState['mode'] = 'EDIT';

                                        console.log('editState', newState);

                                        return newState;
                                    });
                                }} startIcon={<ModeEditIcon />}>
                                    Edit
                                </Button>}

                                <Button variant="contained" type="submit" disabled={this.state.loading}>
                                    Submit
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>
            </>
        );
    }
}

const CreateQuizz = withParams(ManageQuizz);
const EditQuizz = withParams(ManageQuizz);
const CopyQuizz = withParams(ManageQuizz);

export { CreateQuizz, EditQuizz, CopyQuizz };