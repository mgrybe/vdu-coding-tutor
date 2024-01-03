import React from 'react';
import { Link as RouteLink } from "react-router-dom";
import IdTokenContext from './IdTokenContext';
import Typography from '@mui/material/Typography';
import { MODULES_URL, ENROLLMENT_URL } from './Urls';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

import ModeEditIcon from '@mui/icons-material/ModeEdit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';


import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import Module from './Module';
import Stack from '@mui/material/Stack';

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

class Modules extends React.Component {
    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            /*removed: false,
            failed: false,*/
            modules: [],
            filterTerm: '',
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
        }

        this.onReload = this.onReload.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onEnroll = this.onEnroll.bind(this);
        this.onUnenroll = this.onUnenroll.bind(this);
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

        return fetch(MODULES_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                console.log('modules', data);
                this.setState({ modules: data.modules })
                // .slice(0,2)
            })
            .finally(() => this.setState({ loading: false }));
    }

    getModule(moduleId) {
        return fetch(MODULES_URL + "?moduleId=" + moduleId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        });
    }

    queryUntilDeleted(moduleId, retries = 5, callback) {
        if (retries === 0) {
            console.log('failed');
            callback();
            return;
        }

        console.log('querying if deleted');

        this.getModule(moduleId)
            .then(response => {
                if (response.status === 200) {
                    // If the resource was found, schedule the next attempt in 2 seconds
                    setTimeout(() => this.queryUntilDeleted(moduleId, retries - 1, callback), 2000);
                } else if (response.status === 404) {
                    console.log('deleted');
                    callback();
                }
            })
            .catch(response => {
                console.log('error', response);
                callback();
            });
    }

    onEnroll(moduleId, enrollment) {
        this.setState((prevState) => {
            const newState = { ...prevState };

            const module = newState['modules'].find(module => module.id === moduleId);

            module['enrollment'] = enrollment;

            console.log('newSate after enrolll', newState);

            return newState;
        });

        this.showSuccessMessage(`You have enrolled to a module!`);
    }

    onUnenroll(moduleId) {
        this.setState((prevState) => {
            const newState = { ...prevState };

            const module = newState['modules'].find(module => module.id === moduleId);

            module['enrollment'] = null;

            console.log('newSate after unenrolll', newState);

            return newState;
        });

        this.showSuccessMessage("You have cancelled your module enrollment!");
    }

    onRemove(moduleId, title) {
        setTimeout(() => {
            this.setState((prevState) => {
                return ({
                    ...prevState,
                    loading: true
                });
            });
        }, 0);

        setTimeout(() => {
            this.queryUntilDeleted(moduleId, 5, () => {
                this.onReload().finally(() => this.showSuccessMessage(`Module "${title}" was removed successfully!`));
            });
        }, 1000);
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

    applyFilter(term) {
        this.setState((prevState) => {

            const newState = {
                ...prevState, filterTerm: term
            };

            return newState;
        });
    }

    filterItems(items, term) {
        return items.filter(item => item.title.toLowerCase().includes(term.toLowerCase()));
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
        const modules = this.filterItems(this.state.modules, this.state.filterTerm).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })).map((item, index) => (
            <Grid item key={item.id}>
                <Module
                    module={item}
                    editable={true}
                    onLoading={(value) => {
                        this.setState((prevState) => { return { ...prevState, loading: value } })
                    }}
                    onRemove={(moduleId, title) => this.onRemove(moduleId, title)}
                    onEnroll={(moduleId, enrollment) => this.onEnroll(moduleId, enrollment)}
                    onUnenroll={(moduleId) => this.onUnenroll(moduleId)}
                    openConfirmDialog={this.openConfirmDialog}
                />
            </Grid>
        ));

        return (
            <>
                <div className='problemsTable' style={{ marginBottom: '50px' }}>
                    <AlertDialog
                        open={this.state.dialog.isDialogOpen}
                        onClose={this.onHandleCloseDialog}
                        onAgree={this.state.dialog.handleAgree}
                        title={this.state.dialog.title}
                        description={this.state.dialog.description}
                        agreeText="Confirm"
                        disagreeText="Discard"
                    />
                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={this.state.loading}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
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
                    <Typography variant="h2" component="h2">
                        Modules
                    </Typography>
                    <OutlinedInput
                        sx={{ marginBottom: 2, backgroundColor: 'white' }}
                        fullWidth
                        id="outlined-adornment-amount"
                        startAdornment={<InputAdornment position="start"><SearchIcon /></InputAdornment>}
                        variant="filled"
                        onChange={(event) => {
                            this.applyFilter(event.target.value);
                        }}
                    />
                    <Grid container spacing={2}>
                        {modules}
                    </Grid>
                </div>
            </>
        );
    }
}

export default Modules;