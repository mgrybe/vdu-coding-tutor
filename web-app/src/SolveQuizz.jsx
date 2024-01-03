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
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

let COUNTER = 1;

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class ManageQuizz extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            solved: false,
            notSolved: false,
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
            title: '',
            passingScore: 0,
            questions: [

            ],
            invalidQuestions: [

            ]
        }
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let quizzId = this.props.params.solveQuizzId;

        if (quizzId) {
            this.setState({quizzId: quizzId, loading: true });

            fetch(QUIZZES_URL + "?quizzId=" + quizzId + "&detailLevel=BASIC", {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('quizz', data);

                    // Querying while module is null or version is not bumped
                    this.setState((prevState) => {
                        const newState = { ...prevState };

                        newState['title'] = data['title'];
                        newState['passingScore'] = data['passingScore'];
                        newState['questions'] = data['questions'];
                        newState['loading'] = false;
                        newState['alreadySolved'] = data['solved']

                        console.log('hydrated quizz', newState);

                        return newState;
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

    onSubmit(event) {
        event.preventDefault();

        const state = this.state;

        const quizz = {
        };

        if (state.quizzId) {
            quizz['id'] = state.quizzId;
        }

        quizz['questions'] = state.questions.map(question => {
            return {
                id: question.id,
                options: question.options.map(option => {
                    return {
                        id: option.id,
                        correct: option.correct
                    }
                })
            };
        });

        this.setState({ loading: true });

        fetch(QUIZZES_URL + '/solution?quizzId=' + state.quizzId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors',
            body: JSON.stringify(quizz)
        })
            .then(response => response.json())
            .then(solution => {
                console.log('solution', solution);

                this.setState((prevState) => {
                    const newState = { ...prevState, submitted: true, loading: false };

                    newState['solved'] = solution['solved'];
                    newState['alreadySolved'] = solution['solved'];
                    newState['notSolved'] = !solution['solved'];
                    newState['invalidQuestions'] = solution['invalidQuestions'];

                    return newState;
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

    getTotalScore() {
        return this.state.questions.reduce((acc, curr) => acc + parseFloat(curr.score.value), 0);
    }

    createQuestion(question, score, options) {
        return {
            __id: new Date().getTime() + '_' + (COUNTER++) + '',
            value: question || '',
            type: 'SINGLE',
            options: options || [],
        };
    }

    createOption(option) {
        return {
            __id: new Date().getTime() + '_' + (COUNTER++) + '',
            id: '',
            value: option || '',
        };
    }

    render() {

        const previewForm = <Stack spacing={2} direction="column">
            {/*<Paper elevation={5}>
                <Grid container spacing={0} justifyContent="center" alignItems="center">
                    <Grid item xs={12} className="problem-right">
                        <TextField
                            value={this.state.title}
                            label="Quizz title"
                            id="outlined-start-adornment"
                            sx={{ m: 1, width: 'calc(100% - 16px)' }}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    </Grid>
                </Grid>
                        </Paper>*/}

            {this.state.questions.map((question, index) => {
                const style = {}

                if (this.state.invalidQuestions.indexOf(question.id) !== -1) {
                    style['backgroundColor'] = '#ff000026';
                }

                return (
                    <Paper elevation={5} key={question['id']} sx={style}>
                        <Grid container spacing={0} justifyContent="center" alignItems="center">
                            <Grid item xs={12}>
                                <Stack spacing={2} direction="row">
                                    {<RichTextPreviewField
                                        value={question.question}
                                        label="Question"
                                        id="outlined-start-adornment"
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />}
                                    {/*<Box
                                        dangerouslySetInnerHTML={{ __html: question.question }}
                                        required
                                        label="Question"
                                        id="outlined-start-adornment"
                                        style={{ m: 1, marginLeft: '26px', width: 'calc(100% - 16px)' }}
                                />*/}
                                </Stack>
                            </Grid>
                            {
                                question.options.map((option, optionIndex) => {
                                    return (
                                        <Grid key={option['id']} item xs={12} sx={{ p: 2 }}>
                                            <Stack spacing={2} direction="row">
                                                <Stack spacing={2} direction="column">
                                                    {question.type === 'SINGLE' &&
                                                        <Radio checked={option.correct !== undefined && option.correct} value="true" onChange={(event) => {
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
                                                        <Checkbox checked={option.correct !== undefined && option.correct} value="true" onChange={(event) => {
                                                            this.setState((prevState) => {
                                                                //console.log('checkbox val', event.target.checked);
                                                                const newState = { ...prevState };

                                                                newState['questions'][index]['options'][optionIndex]['correct'] = event.target.checked;

                                                                return newState;
                                                            });
                                                        }} />
                                                    }
                                                </Stack>
                                                {<RichTextPreviewField
                                                    value={option.option}
                                                    label="Option"
                                                    id="outlined-start-adornment"
                                                    sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                                />}
                                                {/*<Box
                                                    dangerouslySetInnerHTML={{ __html: option.option }}
                                                    required
                                                    label="Option"
                                                    id="outlined-start-adornment"
                                                    style={{ margin: 1, width: 'calc(100% - 16px)' }}
                                            />*/}
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
                <Snackbar open={this.state.solved} autoHideDuration={6000} onClose={() => this.setState({ solved: false })}>
                    <Alert onClose={() => this.setState({ solved: false })} severity="success" sx={{ width: '100%' }}>
                        Quizz was solved successfully!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.notSolved} autoHideDuration={6000} onClose={() => this.setState({ notSolved: false })}>
                    <Alert onClose={() => this.setState({ notSolved: false })} severity="error" sx={{ width: '100%' }}>
                        Quizz wasn't solved 
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
                    <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
                        Quizz solution submissions failed
                    </Alert>
                </Snackbar>

                <h1>Quizz: {this.state.title} {this.state.alreadySolved ? <Chip icon={<TaskAltIcon />} label={`solved`} color="success" /> : <span />}</h1>

                <form onSubmit={(event) => this.onSubmit(event)}>
                    {previewForm}

                    <Grid container spacing={0} justifyContent="center" alignItems="center">
                        <Grid item xs={12} sx={{ p: 2 }}>
                            <Stack spacing={1} direction="row">
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

const SolveQuizz = withParams(ManageQuizz);

export default SolveQuizz;