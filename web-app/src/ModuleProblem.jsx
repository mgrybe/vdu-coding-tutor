import React from 'react';
import { useParams } from "react-router-dom";
import Typography from '@mui/material/Typography';
import App from './App';
import IdTokenContext from './IdTokenContext';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { PROBLEMS_URL, MODULES_URL } from './Urls';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Link as RouteLink } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

class SolveModuleProblem extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            uniqueId: Date.now(),
            loading: true,
            moduleId: null,
            problemId: null,
            module: {
                problems: [],
                solved: []
            },
            problem: {},
            showSolvedAlert: false,
            showUnsolvedAlert: false
        }

        this.onSolved = this.onSolved.bind(this);
        this.onNotSolved = this.onNotSolved.bind(this);
        this.reloadModule = this.reloadModule.bind(this);
    }

    componentDidUpdate() {
        console.log('componentDidUpdate', this.props.params);

        if (!this.state.loading && this.state.problemId !== this.props.params.problemId) {
            const moduleId = this.props.params.moduleId;
            const problemId = this.props.params.problemId;

            this.onReload(moduleId, problemId).finally(() => {
                this.setState({ uniqueId: Date.now() });
            });
        }
    }

    componentDidMount() {
        console.log('componentDidMount');

        const moduleId = this.props.params.moduleId;
        const problemId = this.props.params.problemId;

        this.onReload(moduleId, problemId);
    }

    reloadModule(moduleId) {
        return fetch(MODULES_URL + "?moduleId=" + moduleId + "&detailLevel=FULL", {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                console.log('2.1');
                this.setState((prevState) => {
                    return { ...prevState, module: data };
                });
            });
    }

    onReload(moduleId, problemId) {

        this.setState({ moduleId: moduleId, problemId: problemId, loading: true });

        console.log('1');
        let promise = fetch(PROBLEMS_URL + "?challengeId=" + problemId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                console.log('1.1');

                this.setState({
                    problem: {
                        code: data.signature,
                        name: data.name,
                        description: data.description,
                        solution: data.last_solution,
                        solved: data.solved
                    }
                });
            });

        promise = promise.then(() => {
            this.reloadModule(moduleId);
        });

        return promise.then(() => { console.log('3'); setTimeout(() => console.log('state', this.state), 500); }).finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
    }

    problemsCount() {
        return this.state.module.problems.length;
    }

    currentProblemNumber() {
        console.log('module problems', this.state.module.problems);
        return this.state.module.problems.findIndex(i => i === this.state.problemId) + 1;
    }

    getNextProblemId() {
        return this.state.module.problems[this.currentProblemNumber() + 1 - 1];
    }

    getPrevProblemId() {
        return this.state.module.problems[this.currentProblemNumber() - 1 - 1];
    }

    getNextUnsolvedProblemId() {
        if (this.state.module.problems.length > 0) {
            /*const problems = this.state.module.problems;
            const solved = this.state.module.solved;

            const unsolved = problems.filter(id => !solved.includes(id));
            const indexOfCurrentProblem = unsolved.indexOf(this.state.problemId);

            return unsolved.slice(indexOfCurrentProblem + 1, unsolved.length).shift();*/
            const problems = this.state.module.problems.slice(
                this.state.module.problems.findIndex(i => i === this.state.problemId) + 1, 
                this.state.module.problems.length
            );
            
            return problems.find(problemId => !this.state.module.solved.includes(problemId));
        }
    }

    getPrevUnsolvedProblemId() {
        if (this.state.module.problems.length > 0) {
            /*const problems = this.state.module.problems;
            const solved = this.state.module.solved;

            const unsolved = problems.filter(id => !solved.includes(id));
            const indexOfCurrentProblem = unsolved.indexOf(this.state.problemId);

            return unsolved.slice(0, indexOfCurrentProblem).pop();*/
            const problems = this.state.module.problems.slice(
                0, 
                this.state.module.problems.findIndex(i => i === this.state.problemId)
            );
            
            return problems.findLast(problemId => !this.state.module.solved.includes(problemId));
        }
    }

    onSolved() {
        console.log('onSolved!');

        this.setState((prevState) => {
            const newState = { ...prevState, showSolvedAlert: true };
            newState['problem']['solved'] = true;
            return newState;
        });

        const moduleId = this.props.params.moduleId;
        const problemId = this.props.params.problemId;

        this.reloadModule(moduleId);
    }

    onNotSolved() {
        console.log('onNotSolved!');

        this.setState((prevState) => {
            return { ...prevState, showUnsolvedAlert: true };
        });
    }

    render() {

        let solution = (this.state.problem && this.state.problem.solution) ? this.state.problem.solution.code : '';

        return (
            <>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={this.state.loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>

                <Snackbar open={this.state.showSolvedAlert} autoHideDuration={6000} onClose={() => this.setState({ showSolvedAlert: false })}>
                    <Alert onClose={() => this.setState({ showSolvedAlert: false })} severity="success" sx={{ width: '100%' }}>
                        Module programming task solved successfully!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.showUnsolvedAlert} autoHideDuration={6000} onClose={() => this.setState({ showUnsolvedAlert: false })}>
                    <Alert onClose={() => this.setState({ showUnsolvedAlert: false })} severity="error" sx={{ width: '100%' }}>
                        Module programming task solution has problems
                    </Alert>
                </Snackbar>

                <Paper elevation={5} sx={{ marginBottom: 1, paddingBottom: 2, paddingLeft: '24px', paddingTop: 2 }}>

                    <Grid container spacing={0} justifyContent="left" alignItems="left">
                        <Grid item xs={5}>
                            <Typography variant="h5" component="h5" >
                                <RouteLink to={`/view-module/${this.state.module.id}`} style={{ textDecoration: 'none' }}>
                                    Module: {this.state.module.name}
                                </RouteLink>
                                <span> </span>
                                <Chip icon={<CheckCircleIcon />} label={(Math.round((this.state.module.solved.length / this.state.module.problems.length) * 100) || 0) + '%'} color="primary" />
                            </Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Typography variant="h5" component="h5" >
                                Task ({this.currentProblemNumber()} / {this.problemsCount()}): {this.state.problem.name} {this.state.problem.solved ? <Chip icon={<TaskAltIcon />} label="solved" color="success" /> : <span />}
                            </Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <div style={{ marginRight: '7px' }}>
                                <Stack spacing={1} direction="row-reverse">
                                    <IconButton disabled={this.currentProblemNumber() === this.problemsCount()} size="small" component="label" variant="outlined"
                                        onClick={() => window.location.href = `#/module-problem/${this.state.moduleId}/${this.getNextProblemId()}`}>
                                        <NavigateNextIcon />
                                    </IconButton>
                                    <Button disabled={!this.getNextUnsolvedProblemId()} size="small" component="label" variant="contained" endIcon={<NavigateNextIcon />}
                                        onClick={() => window.location.href = `#/module-problem/${this.state.moduleId}/${this.getNextUnsolvedProblemId()}`}>
                                        Next
                                    </Button>
                                    <Button disabled={!this.getPrevUnsolvedProblemId()} size="small" component="label" variant="contained" startIcon={<NavigateBeforeIcon />}
                                        onClick={() => window.location.href = `#/module-problem/${this.state.moduleId}/${this.getPrevUnsolvedProblemId()}`}>
                                        Prev
                                    </Button>
                                    <IconButton disabled={this.currentProblemNumber() === 1} size="small" component="label" variant="outlined"
                                        onClick={() => window.location.href = `#/module-problem/${this.state.moduleId}/${this.getPrevProblemId()}`}>
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </Stack>
                            </div>
                        </Grid>
                    </Grid>
                </Paper>

                {<div key={this.state.uniqueId}>
                    {!this.state.loading && <App onSolved={this.onSolved} onNotSolved={this.onNotSolved} code={this.state.problem.code} solution={solution} challenge={this.state.problemId} description={this.state.problem.description} />}
                </div>}
            </>

        );
    }
}

const ModuleProblem = withParams(SolveModuleProblem);

export { ModuleProblem };