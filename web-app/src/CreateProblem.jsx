import React from 'react';
import { useParams } from "react-router-dom";
import { PROBLEMS_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import TagsField from './TagsField';

const options = {
    selectOnLineNumbers: true,
    fontFamily: 'MonoLisa, Menlo, Monaco, "Courier New", monospace',
    fontSize: '16px',
    fontWeight: '100'
};

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class ManageProblem extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            action: 'CREATE',
            loading: false,
            failed: false,
            submitted: false,
            problem: {
                name: '',
                description: '',
                difficulty: '',
                signature: '',
                assertions: '',
                solutions: [
                    {
                        summary: '',
                        content: ''
                    }
                ],
                tags: []
            }
        }

        this.setFieldValue = this.setFieldValue.bind(this);
        this.onCreate = this.onCreate.bind(this);
    }

    componentDidMount() {
        console.log('componentDidMount');

        let challengeId = this.props.params.editProblemId;

        if (challengeId) {
            this.setState({ action: 'EDIT' });
        } else {
            challengeId = this.props.params.copyProblemId;

            if (challengeId) {
                this.setState({ action: 'COPY' });
            }
        }

        if (challengeId) {
            this.setState({ challengeId: challengeId, loading: true })

            fetch(PROBLEMS_URL + "?challengeId=" + challengeId + "&detailLevel=FULL", {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('problem', data);
                    //this.setState({ problem: data });
                    this.setState((prevState) => {
                        const newState = { ...prevState };

                        newState['problem'] = { ...newState.problem, ...data };

                        console.log('newState', newState);

                        if (this.props.params.copyProblemId) {
                            delete newState.problem['id'];
                        }

                        return newState;
                    });
                })
                //.catch(() => this.setState({ code: '', challengeId: '', name: '' }))
                .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
        }
    }

    editorDidMount(editor, monaco) {

        monaco.editor.defineTheme("myTheme", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": "#27374D"
            },
        });
    }

    getProblem(problemId) {
        console.log(`getProblem(${problemId})`);

        return fetch(PROBLEMS_URL + "?challengeId=" + problemId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                return null;
            }
        });
    }

    queryUntil(problemId, retries = 5, predicate, callback) {
        if (retries === 0) {
            console.log('failed');
            callback();
            return;
        }

        console.log('querying until');

        this.getProblem(problemId)
            .then(problem => {
                console.log('Existing', this.state.problem, 'New', problem);

                if (predicate(problem)) {
                    // If the resource was found, schedule the next attempt in 2 seconds
                    setTimeout(() => this.queryUntil(problemId, retries - 1, predicate, callback), 2000);
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

        const problem = {
            ...this.state.problem
        };

        console.log('Creating problem', problem);

        this.setState((prevState) => {

            fetch(PROBLEMS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors',
                body: JSON.stringify(problem)
            })
                .then(response => response.json())
                .then(problem => {
                    // TODO: add success alert here
                    console.log(problem);

                    // Querying while module is null or version is not bumped
                    this.queryUntil(problem.id, 5, (problem) => problem === null || parseInt(problem.version) <= parseInt(this.state.problem.version), () => {
                        this.setState((prevState) => {    
                            return { ...prevState, submitted: true, loading: false };
                        });
                    });  
                })
                .catch((error) => {
                    // TODO: add error alert here
                    console.error(`Problem create error: ${error.message}`);

                    this.setState((prevState) => {
                        return { ...prevState, failed: true };
                    });
                });
                //.finally(() => this.setState({ loading: false }));

            return ({
                ...prevState,
                loading: true
            });
        });
    }

    setFieldValue(fieldId, value) {
        this.setState((prevState) => {

            const newState = {
                ...prevState
            };

            newState['problem'][fieldId] = value;

            return newState;
        });
    }

    render() {
        const solutions = this.state.problem.solutions.map((solution, index) => {
            return (<div key={index} style={{ width: "100%" }}>
                <Typography variant="h4" component="h4" sx={{ m: 1, width: 'calc(100% - 16px)' }}>
                    Solution #{index + 1}
                </Typography>
                <Grid item xs={12} className="problem-right">
                    <TextField
                        value={this.state.problem.solutions[index].summary}
                        required
                        label="Solution summary"
                        id="outlined-start-adornment"
                        onChange={(event) => {
                            this.setState((prevState) => {

                                const newState = {
                                    ...prevState
                                };

                                newState['problem']['solutions'][index]['summary'] = event.target.value;

                                return newState;
                            });
                        }}
                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                    />
                </Grid>
                <Grid item xs={12} className="problem-right">
                    <TextField
                        value={this.state.problem.solutions[index].content}
                        required
                        label="Solution"
                        multiline
                        rows={16}
                        id="outlined-start-adornment"
                        onChange={(event) => {
                            this.setState((prevState) => {

                                const newState = {
                                    ...prevState
                                };

                                newState['problem']['solutions'][index]['content'] = event.target.value;

                                return newState;
                            });
                        }}
                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                    />
                </Grid>
                <Grid item xs={12} className="problem-right" sx={{ p: 2 }}>
                    <IconButton disabled={this.state.loading} color="primary" onClick={() => {
                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState.problem.solutions.splice(index + 1, 0, {
                                summary: '', content: ''
                            });

                            return newState;
                        });
                    }}>
                        <AddIcon />
                    </IconButton>
                    <IconButton disabled={this.state.loading || this.state.problem.solutions.length === 1} color="primary" onClick={() => {
                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState.problem.solutions.splice(index, 1);

                            return newState;
                        });
                    }}>
                        <DeleteIcon />
                    </IconButton>
                </Grid>

            </div>);
        });

        return (
            <div className='problemsTable' style={{ marginBottom: '50px' }}>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={this.state.loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <Snackbar open={this.state.submitted} autoHideDuration={6000} onClose={() => this.setState({ submitted: false })}>
                    <Alert onClose={() => this.setState({ submitted: false })} severity="success" sx={{ width: '100%' }}>
                        Problem submitted successfully!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
                    <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
                        Problem submissions failed
                    </Alert>
                </Snackbar>
                <Typography variant="h2" component="h2" >
                {this.state.action === 'CREATE' ? 'Create task' : (this.state.action === 'EDIT' ? 'Edit task' : (this.state.action === 'COPY'? 'Copy task': ''))}
                </Typography>
                <div>
                    <Paper elevation={5}>
                        <form onSubmit={(event) => this.onCreate(event)}>
                            <Grid container spacing={0} justifyContent="center" alignItems="center">
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.problem.name}
                                        required
                                        label="Task name"
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('name', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    {/*<TextEditor 
                                        html={this.state.problem.description} 
                                        onChange={(value) => {
                                            this.setFieldValue('description', value);
                                        }}
                                    />*/}
                                    <TextField
                                        value={this.state.problem.description}
                                        required
                                        label="Task description"
                                        multiline
                                        rows={8}
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('description', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.problem.difficulty}
                                        required
                                        select
                                        fullWidth
                                        id="demo-simple-select"
                                        label="Difficulty"
                                        onChange={(event) => {
                                            this.setFieldValue('difficulty', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    >
                                        <MenuItem value={'easy'}>Easy</MenuItem>
                                        <MenuItem value={'medium'}>Medium</MenuItem>
                                        <MenuItem value={'hard'}>Hard</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TagsField 
                                        value={this.state.problem.tags} 
                                        onChange={(tags) => this.setFieldValue('tags', tags)}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                    {/*<TextField
                                        value={this.state.problem.tags.join('\n')}
                                        required
                                        label="Tags (one tag per line)"
                                        multiline
                                        rows={4}
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('tags', event.target.value.split('\n'));
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />*/}
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.problem.signature}
                                        required
                                        label="Task signature"
                                        multiline
                                        rows={8}
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('signature', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                {solutions}
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.problem.assertions}
                                        required
                                        label="Task assertions"
                                        multiline
                                        rows={8}
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('assertions', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right" sx={{ p: 2 }}>
                                    <Button variant="contained" type="submit" disabled={this.state.loading}>
                                        Submit
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </div>
            </div>
        );
    }
}

const CreateProblem = withParams(ManageProblem);
const EditProblem = withParams(ManageProblem);
const CopyProblem = withParams(ManageProblem);

//export default withParams(CreateProblem);
export { CreateProblem, EditProblem, CopyProblem };