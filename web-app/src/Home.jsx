import React from 'react';
import { HOME_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Module from './Module';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import Achievement from './achievementBadge';

import Stack from '@mui/material/Stack';
import { Link as RouteLink } from "react-router-dom";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import Chip from '@mui/material/Chip';

import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SpaIcon from '@mui/icons-material/Spa';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import TagIcon from '@mui/icons-material/Tag';

import Divider from '@mui/material/Divider';

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

class Home extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            enrollments: {
                modules: []
            },
            achievements: [],
            solvedProblems: [],
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
            }
        };

        this.onReload = this.onReload.bind(this);
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        this.onReload();
    }

    onReload() {
        this.setState({ loading: true });

        return fetch(HOME_URL + '/enrolled-modules', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                console.log('home', data);
                this.setState((prevState) => {
                    const newState = { ...prevState };

                    newState['enrollments'] = data;

                    return newState;
                });
            })
            .then(() => {
                return fetch(HOME_URL + '/achievements', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                    mode: 'cors'
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('achievements', data);

                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState['achievements'] = data;

                            return newState;
                        });
                    })
            }).then(() => {
                return fetch(HOME_URL + '/solved-problems', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                    mode: 'cors'
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('solved-problems', data);

                        this.setState((prevState) => {
                            const newState = { ...prevState };

                            newState['solvedProblems'] = data;

                            return newState;
                        });
                    })
            })
            .finally(() => this.setState({ loading: false }));
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

    onUnenroll(moduleId) {
        this.onReload().then(() => this.showSuccessMessage("You have cancelled your module enrollment!"));
    }

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
        const modules = this.state.enrollments.modules.map((item, index) => (
            <Grid item key={index}>
                <Module key={item.id}
                    editable={false}
                    module={item}
                    onLoading={(value) => {
                        this.setState((prevState) => { return { ...prevState, loading: value } })
                    }}
                    onUnenroll={(moduleId) => this.onUnenroll(moduleId)}
                    openConfirmDialog={this.openConfirmDialog}
                />
            </Grid>
        ));

        const badges = this.state.achievements.map((item, index) => (
            <Grid item key={index}>
                {/*<Badge key={index} text={item} />*/}
                {/*<BadgeV2 key={index} svg={SVG} />*/}
                <Achievement key={index} text={item} earned={true} />
            </Grid>
        ));

        return (
            <Box sx={{ m: 2 }}>
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

                <Grid container direction="row">
                    <Grid xs={12} elevation={5}>
                        <Typography variant="h2" component="h2">
                            Home
                        </Typography>
                    </Grid>

                    <Grid xs={12} elevation={5}>
                        <Typography variant="h4" component="h4">
                            My Modules
                        </Typography>
                    </Grid>
                    {modules.length > 0
                        &&
                        <>
                            <Grid xs={12}>
                                <div style={{ paddingTop: '15px' }}>
                                    <Grid container spacing={2}>
                                        {modules}
                                    </Grid>
                                </div>
                            </Grid>

                        </>
                        ||
                        <>
                            <MuiAlert severity="info">You are not enrolled in any modules yet!</MuiAlert>
                        </>}
                    <Grid xs={12}>
                        <Divider style={{ marginTop: '15px', marginBottom: '15px' }} />
                    </Grid>

                    <Grid xs={12} elevation={5}>
                        <Typography variant="h4" component="h4">
                            My achievements
                        </Typography>
                    </Grid>
                    {badges.length > 0
                        &&
                        <>
                            <Grid xs={12}>
                                <div style={{ paddingTop: '15px' }}>
                                    <Grid container spacing={2}>
                                        {badges}
                                    </Grid>
                                </div>
                            </Grid>
                        </>
                        ||
                        <>
                            <MuiAlert severity="info">You do not have any achievements yet!</MuiAlert>
                        </>}

                    <Grid xs={12}>
                        <Divider style={{ marginTop: '15px', marginBottom: '15px' }} />
                    </Grid>

                    <Grid xs={12} elevation={5}>
                        <Typography variant="h4" component="h4">
                            My solved problems
                        </Typography>
                    </Grid>
                    <Grid xs={12}>
                        {this.state.solvedProblems.length > 0 
                        &&
                        <div style={{ paddingTop: '15px' }}>
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
                                        {this.state.solvedProblems.map((problem, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    {index + 1}.
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    <RouteLink to={`/challenge/${problem.id}`} style={{}}>
                                                        {problem.title}
                                                    </RouteLink>
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
                                                <TableCell align="left">{problem.solved ? <Chip icon={<TaskAltIcon />} size="small" label="solved" color="success" /> : <span />}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                        ||
                        <>
                            <MuiAlert severity="info">You do not have any solved problems yet!</MuiAlert>
                        </>}
                    </Grid>
                </Grid>
            </Box>
        );
    }
}

export default Home;