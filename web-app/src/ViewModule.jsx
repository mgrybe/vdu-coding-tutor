import React from 'react';
import { useParams } from "react-router-dom";
import { PROBLEMS_URL, MODULES_URL, ENROLLMENT_URL, QUIZZES_URL, CONTENTS_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchIcon from '@mui/icons-material/Search';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import { Link as RouteLink } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SpaIcon from '@mui/icons-material/Spa';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import TagIcon from '@mui/icons-material/Tag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DifficultyChip from './DifficultyChip';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Achievement from './achievementBadge';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

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

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class ManageModule extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            failed: false,
            contents: [],
            problems: [],
            quizzes: [],
            dialog: {
                title: "Confirm action",
                description: "Please confirm your action",
                isDialogOpen: false,
                handleAgree: () => { },
            },
            errorAlert: {
                open: false,
                text: ''
            },
            successAlert: {
                open: false,
                text: ''
            },
            module: {
                name: '',
                summary: '',
                description: '',
                difficulty: '',
                achievement: '',
                tags: [],
                problems: [],
                solved: []
            }
        };

        this.onEnroll = this.onEnroll.bind(this);
        this.onUnenroll = this.onUnenroll.bind(this);
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let moduleId = this.props.params.viewModuleId;

        this.setState({ loading: true });

        let promise = fetch(PROBLEMS_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                console.log('problems#2', data);
                this.setState({
                    allProblems: data.problems.map(item => {
                        item.checked = false;
                        return item;
                    })
                })
            });

        promise = promise.then(() => {
            return fetch(CONTENTS_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('contents', data);
                    this.setState({
                        allContents: data.contents
                    })
                });
        });

        promise = promise.then(() => {
            return fetch(QUIZZES_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('quizzes', data);
                    this.setState({
                        allQuizzes: data.quizzes
                    })
                });
        });

        if (moduleId) {
            this.setState({ moduleId: moduleId });

            promise = promise.then(() => {
                fetch(MODULES_URL + "?moduleId=" + moduleId + "&detailLevel=FULL", {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                    mode: 'cors'
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('module', data);

                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState['module'] = { ...newState.module, ...data };

                            const problems = newState['allProblems'];
                            const contents = newState['allContents'];
                            const quizzes = newState['allQuizzes'];

                            if (data['problems']) {
                                const sortedProblems = [];
                                for (let problemId of data['problems']) {
                                    const problem = problems.find(problem => problem.id === problemId);

                                    if (problem) {
                                        sortedProblems.push(problem);
                                    }
                                }

                                newState['problems'] = sortedProblems;
                            }

                            if (data['contents']) {
                                const sortedContents = [];
                                for (let contentId of data['contents']) {
                                    const content = contents.find(content => content.id === contentId);

                                    if (content) {
                                        sortedContents.push(content);
                                    }
                                }

                                newState['contents'] = sortedContents;
                            }

                            if (data['quizzes']) {
                                const sortedQuizzes = [];
                                for (let quizzId of data['quizzes']) {
                                    const quizz = quizzes.find(quizz => quizz.id === quizzId);

                                    if (quizz) {
                                        sortedQuizzes.push(quizz);
                                    }
                                }

                                newState['quizzes'] = sortedQuizzes;
                            }

                            return newState;
                        });
                    })
                    .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
            });
        }

        promise.finally(() => this.setState({ loading: false }));
    }

    isStarted() {
        return this.state.problems.find(p => p.solved) !== undefined;
    }

    getFirstUnsolvedProblem() {
        return this.state.problems.find(p => !p.solved);
    }

    onEnroll(moduleId) {
        this.openConfirmDialog({ description: `Do you really want to enroll to this module?` }, () => {
            this.setState((prevState) => { return { prevState, ...{ loading: true } } });

            fetch(ENROLLMENT_URL + "?moduleId=" + moduleId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors',
                body: JSON.stringify({})
            })
                .then(response => response.json())
                .then(data => {
                    console.log('enrolled', data);

                    this.setState((prevState) => {
                        const newState = { ...prevState };

                        newState['module']['enrolled'] = data;

                        return newState;
                    });

                    this.showSuccessMessage(`You have enrolled to a module!`);
                })
                .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
        });
    }

    onUnenroll(moduleId) {
        this.openConfirmDialog({ description: `Do you really want to unenroll from this module?` }, () => {
            this.setState((prevState) => { return { prevState, ...{ loading: true } } });

            fetch(ENROLLMENT_URL + "?moduleId=" + moduleId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('unenrolled', data);
                    this.setState((prevState) => {
                        const newState = { ...prevState };

                        delete newState['module']['enrolled'];

                        return newState;
                    });

                    this.showSuccessMessage("You have cancelled your module enrollment!");
                })
                .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
        });
    }

    onRemove(moduleId, title) {
        this.openConfirmDialog({ description: `Do you really want to delete module: "${title}"` }, () => {
            this.setState((prevState) => { return { prevState, ...{ loading: true } } });

            fetch(MODULES_URL + "?moduleId=" + moduleId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('removed', data);

                    this.showSuccessMessage(`Module "${title}" was removed successfully!`);
                })
                .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));

        });
    }

    onFinish(moduleId, title) {
        this.openConfirmDialog({ description: `Do you really want to finish module: "${title}"` }, () => {
            this.setState((prevState) => { return { prevState, ...{ loading: true } } });

            fetch(MODULES_URL + "/finish?moduleId=" + moduleId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('finished', data);

                    this.setState((prevState) => {
                        const newState = { ...prevState };

                        newState['module']['finished'] = data['modules'][moduleId];

                        return newState;
                    });

                    this.showSuccessMessage(`Module "${title}" was finished successfully!`);
                })
                .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
        });
    }

    canFinish() {

        const problemsLeftToSolve = this.state.module.problems.filter(p => !this.state.module.solved.includes(p));

        return this.state.problems.length > 0 && this.state.module.enrolled && problemsLeftToSolve.length === 0 && !this.state.module.finished;
    }

    openConfirmDialog = (options, confirmFn) => {
        this.setState((prevState) => {
            const newState = { ...prevState };
            newState.dialog.isDialogOpen = true;
            newState.dialog.description = options.description;
            newState.dialog.handleAgree = confirmFn;
            return newState;
        });
    };

    onHandleCloseDialog = () => {
        this.setState((prevState) => {
            const newState = { ...prevState };
            newState.dialog.isDialogOpen = false;
            return newState;
        });
    };

    showSuccessMessage(text) {
        this.setState((prevState) => {
            const newState = { ...prevState };

            newState['successAlert'] = {
                open: true,
                text: text
            };

            return newState;
        });
    }

    showErrorMessage(text) {
        this.setState((prevState) => {
            const newState = { ...prevState };

            newState['errorAlert'] = {
                open: true,
                text: text
            };

            return newState;
        });
    }

    render() {

        return (
            <div style={{ marginBottom: '50px' }}>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={this.state.loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <AlertDialog
                    open={this.state.dialog.isDialogOpen}
                    onClose={this.onHandleCloseDialog}
                    onAgree={this.state.dialog.handleAgree}
                    title={this.state.dialog.title}
                    description={this.state.dialog.description}
                    agreeText="Confirm"
                    disagreeText="Discard"
                />
                <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
                    <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
                        Module loading failed
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.successAlert.open} autoHideDuration={6000} onClose={() => this.setState({ successAlert: { open: false } })}>
                    <Alert onClose={() => this.setState({ successAlert: { open: false } })} severity="success" sx={{ width: '100%' }}>
                        {this.state.successAlert.text}
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.errorAlert.open} autoHideDuration={6000} onClose={() => this.setState({ errorAlert: { open: false } })}>
                    <Alert onClose={() => this.setState({ errorAlert: { open: false } })} severity="error" sx={{ width: '100%' }}>
                        {this.state.errorAlert.text}
                    </Alert>
                </Snackbar>
                <Typography variant="h2" component="h2" >
                    Module: {this.state.module.name}
                </Typography>
                <div>
                    <Paper elevation={5}>
                        <form onSubmit={(event) => this.onCreate(event)}>
                            <Grid container spacing={0} justifyContent="center" alignItems="flex-start">
                                <Grid item xs={6}>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            <Typography variant="h5" component="h5" >
                                                Description
                                            </Typography>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            {this.state.module.description}
                                        </div>
                                    </Grid>
                                    {this.state.module.enrolled && <>
                                        <Grid item xs={12}>
                                            <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                                <Typography variant="h5" component="h5" >
                                                    Progress
                                                </Typography>
                                            </div>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                                {!this.state.module.finished && <Chip size="small" icon={<CheckCircleIcon />} label={(Math.round((this.state.module.solved.length / this.state.module.problems.length) * 100) || 0) + '%'} color="primary" />}

                                                {this.state.module.finished ? <Chip icon={<TaskAltIcon />} size="small" label="finished" color="success" /> : <span />}
                                            </div>
                                        </Grid>
                                    </>
                                    }
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            <Typography variant="h5" component="h5" >
                                                Difficulty
                                            </Typography>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            <DifficultyChip difficulty={this.state.module.difficulty} />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            <Typography variant="h5" component="h5" >
                                                Tags
                                            </Typography>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                            {this.state.module.tags.join('\n')}
                                        </div>
                                    </Grid>
                                </Grid>
                                <Grid item xs={6}>
                                    <Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)', height: 100 }}>
                                            <Stack spacing={1} direction="row" alignItems="flex-start" justifyContent="flex-end">
                                                {this.state.problems.length > 0 && this.state.module.enrolled &&
                                                    <>
                                                        {
                                                            this.state.problems.length > 0 && this.getFirstUnsolvedProblem() && !this.isStarted() &&
                                                            <RouteLink to={`/module-problem/${this.state.moduleId}/${this.getFirstUnsolvedProblem().id}`} style={{ textDecoration: 'none' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    disabled={this.state.loading}
                                                                    startIcon={<PlayCircleFilledWhiteIcon />}
                                                                >Start</Button>
                                                            </RouteLink>
                                                        }

                                                        {this.state.problems.length > 0 && this.getFirstUnsolvedProblem() && this.isStarted() &&
                                                            <RouteLink to={`/module-problem/${this.state.moduleId}/${this.getFirstUnsolvedProblem().id}`} style={{ textDecoration: 'none' }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    disabled={this.state.loading}
                                                                    startIcon={<PlayCircleOutlineIcon />}
                                                                >Resume</Button>
                                                            </RouteLink>
                                                        }

                                                        <Button variant="outlined"
                                                            onClick={() => this.onUnenroll(this.state.moduleId)}
                                                            startIcon={<ClearIcon />}
                                                        >Unenroll</Button>
                                                    </>}
                                                {this.state.problems.length > 0 && !this.state.module.enrolled &&
                                                    <Button variant="outlined"
                                                        onClick={() => this.onEnroll(this.state.moduleId)}
                                                        startIcon={<AddIcon />}
                                                    >Enroll</Button>}

                                                {this.canFinish() &&
                                                    <Button variant="outlined"
                                                        onClick={() => this.onFinish(this.state.moduleId, this.state.module.name)}
                                                        startIcon={<DoneOutlineIcon />}
                                                    >Finish module</Button>}

                                                <RouteLink to={`/edit-module/${this.state.moduleId}`} style={{ textDecoration: 'none' }}>
                                                    <IconButton disabled={this.state.loading} color="primary"><ModeEditIcon /></IconButton>
                                                </RouteLink>
                                                <RouteLink to={`/copy-module/${this.state.moduleId}`} style={{ textDecoration: 'none' }}>
                                                    <IconButton disabled={this.state.loading} color="primary"><ContentCopyIcon /></IconButton>
                                                </RouteLink>
                                                <IconButton disabled={this.state.loading} color="primary" onClick={() => this.onRemove(this.state.moduleId, this.state.module.name)}><DeleteIcon /></IconButton>
                                            </Stack>
                                        </div>
                                    </Grid>

                                    {/*<Grid item xs={12}>
                                        <div style={{ margin: 8, width: 'calc(100% - 16px)', height: 100 }}>
                                            <Stack spacing={1} direction="row" alignItems="flex-start" justifyContent="flex-end">
                                                <Achievement earned={false} text={this.state.module.achievement} />
                                            </Stack>
                                        </div>    
                                      </Grid>*/}
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <Typography variant="h5" component="h5" >
                                            Reading
                                        </Typography>
                                    </div>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <TableContainer component={Paper}>
                                            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>Title</TableCell>
                                                        <TableCell align="left">Tags</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {this.state.contents.map((content, index) => (
                                                        <TableRow
                                                            key={index}
                                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                {index + 1}.
                                                            </TableCell>
                                                            <TableCell component="th" scope="row">
                                                                <RouteLink to={`/view-content/${content.id}`} style={{}}>
                                                                    {content.title}
                                                                </RouteLink>
                                                            </TableCell>
                                                            <TableCell align="left">
                                                                <Stack spacing={1} direction="row">
                                                                    {content.tags.map((tag, index) =>
                                                                        <Chip key={'tag_' + index} icon={<TagIcon />} size="small" label={tag} style={{ textTransform: 'lowercase' }} />
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <Typography variant="h5" component="h5" >
                                            Tasks
                                        </Typography>
                                    </div>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <TableContainer component={Paper}>
                                            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>Title</TableCell>
                                                        <TableCell align="left">Tags</TableCell>
                                                        <TableCell align="left">Difficulty</TableCell>
                                                        <TableCell align="left">Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {this.state.problems.map((problem, index) => (
                                                        <TableRow
                                                            key={index}
                                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                {index + 1}.
                                                            </TableCell>
                                                            <TableCell component="th" scope="row">
                                                                {this.state.module.enrolled &&
                                                                    <RouteLink to={`/module-problem/${this.state.moduleId}/${problem.id}`} style={{ textDecoration: 'none' }}>
                                                                        {problem.title}
                                                                    </RouteLink>}
                                                                {!this.state.module.enrolled && <span>{problem.title}</span>}
                                                            </TableCell>
                                                            <TableCell align="left">
                                                                <Stack spacing={1} direction="row">
                                                                    {problem.tags.map((tag, index) =>
                                                                        <Chip key={'tag_' + index} icon={<TagIcon />} size="small" label={tag} style={{ textTransform: 'lowercase' }} />
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell align="left">{
                                                                problem.difficulty === 'easy' ?
                                                                    <Chip size="small" label={problem.difficulty} icon={<SpaIcon />} color="success" variant="outlined" /> :
                                                                    problem.difficulty === 'medium' ?
                                                                        <Chip key={'difficulty_' + index} size="small" label={problem.difficulty} icon={<PsychologyAltIcon />} color="warning" variant="outlined" /> :
                                                                        <Chip key={'difficulty_' + index} size="small" label={problem.difficulty} icon={<WhatshotIcon />} color="error" variant="outlined" />
                                                            }</TableCell>
                                                            <TableCell align="left">{this.state.module.enrolled && problem.solved ? <Chip icon={<TaskAltIcon />} size="small" label="solved" color="success" /> : <span />}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <Typography variant="h5" component="h5" >
                                            Quizzes
                                        </Typography>
                                    </div>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <div style={{ margin: 8, width: 'calc(100% - 16px)' }}>
                                        <TableContainer component={Paper}>
                                            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>Title</TableCell>
                                                        <TableCell align="left">Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {this.state.quizzes.map((quizz, index) => (
                                                        <TableRow
                                                            key={index}
                                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                        >
                                                            <TableCell component="th" scope="row">
                                                                {index + 1}.
                                                            </TableCell>
                                                            <TableCell component="th" scope="row">
                                                                <RouteLink to={`/solve-quizz/${quizz.id}`} style={{}}>
                                                                    {quizz.title}
                                                                </RouteLink>
                                                            </TableCell>
                                                            <TableCell align="left">{quizz.solved ? <Chip icon={<TaskAltIcon />} size="small" label={`solved (${quizz.solved.score} / ${quizz.totalScore})`} color="success" /> : <span />}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </div>
            </div>
        );
    }
}

const ViewModule = withParams(ManageModule);

export { ViewModule };