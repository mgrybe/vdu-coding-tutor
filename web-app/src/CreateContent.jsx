import React, { useState, useRef } from 'react';
import { useParams } from "react-router-dom";
import RichTextField from './RichTextField';
import IdTokenContext from './IdTokenContext';
import { CONTENTS_URL } from './Urls';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import TagsField from './TagsField';

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class ManageContent extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            contentId: null,
            loading: false,
            initialized: false,
            action: 'CREATE',
            mode: 'EDIT',
            version: '0',
            failed: false,
            tags: ['no category'],
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
            content: {
                value: '',
                error: false,
                errorMessages: [],
                validators: [
                    (value) => (!value || value.trim() === '<p></p>') && "Content is required"
                ]
            }
        }
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let contentId = this.props.params.editContentId;

        if (contentId) {
            this.setState({ contentId: contentId, action: 'EDIT' });
        } else {
            contentId = this.props.params.copyContentId;

            if (contentId) {
                this.setState({ action: 'COPY' });
            }
        }

        if (contentId) {
            this.setState({ loading: true });

            fetch(CONTENTS_URL + "?contentId=" + contentId + "&detailLevel=FULL", {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('content', data);
                    setTimeout(() => {
                        this.setState((prevState) => {
                            const newState = { ...prevState };
    
                            newState['title']['value'] = data['title'];
                            newState['content']['value'] = data['content'];
                            newState['tags'] = data['tags'];
                            newState['version'] = data['version'];
                            newState['loading'] = false;
                            newState['initialized'] = true;
    
                            console.log('hydrated quizz', newState);
    
                            return newState;
                        });
                    }, 1000);
                    
                })
                .catch((error) => {
                    console.error(`Module create error: ${error.message}`);

                    this.setState((prevState) => {
                        return { ...prevState, failed: true, loading: false, initialized: true };
                    });
                });
        } else {
            this.setState({ initialized: true });
        }
    }

    getContent(contentId) {
        return fetch(CONTENTS_URL + "?contentId=" + contentId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        });
    }

    queryUntil(contentId, retries = 5, predicate, callback) {
        if (retries === 0) {
            console.log('failed');
            callback();
            return;
        }

        console.log('querying until');

        this.getContent(contentId)
            .then(response => {
                if (response.ok) {
                    // Only parse the response as JSON if the status is in the range 200-299
                    return response.json();
                } else {
                    // Optionally, you could throw an error or return a rejection here
                    // to handle non-200 responses in your catch block
                    //throw new Error('Network response was not ok: ' + response.statusText);
                    return null;
                }
            })
            .then(module => {
                console.log('Existing', this.state.module, 'New', module);

                if (predicate(module)) {
                    // If the resource was found, schedule the next attempt in 2 seconds
                    setTimeout(() => this.queryUntil(contentId, retries - 1, predicate, callback), 2000);
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

        const content = {
            title: state.title.value,
            content: state.content.value,
            tags: state.tags,
        };

        if (state.contentId) {
            content['id'] = state.contentId;
        }

        this.setState({ loading: true });

        fetch(CONTENTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors',
            body: JSON.stringify(content)
        })
            .then(response => response.json())
            .then(content => {
                console.log('created', content);

                this.setState((prevState) => {
                    const newState = { ...prevState };
                    newState['contentId'] = content['id'];
                    return newState;
                })

                // Querying while module is null or version is not bumped
                this.queryUntil(content.id, 5, (content) => content === null || parseInt(content.version) <= parseInt(this.state.version), () => {
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

        console.log('on-create event', content);
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

    render() {

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

                <h1>Create content</h1>

                {this.state.initialized && <form onSubmit={(event) => this.onCreate(event)}>
                    <Stack spacing={2} direction="column">
                        <Paper elevation={5}>
                            <Grid container spacing={0} justifyContent="center" alignItems="center">
                                <Grid item xs={12}>
                                    <Stack spacing={2} direction="column" sx={{ p: 2 }}>
                                        <TextField
                                            required
                                            value={this.state.title.value}
                                            label="Content title"
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

                                        <TagsField value={this.state.tags} onChange={(tags) => {
                                            this.setState((prevState) => {
                                                return { ...prevState, tags }
                                            })
                                        }} />

                                        <RichTextField
                                            value={this.state.content.value}
                                            required
                                            label="Question"
                                            id="outlined-start-adornment"
                                            //sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                            onChange={(event) => {
                                                this.setState((prevState) => {
                                                    const newState = { ...prevState };

                                                    newState['content'] = this.validateField(event.target.value, newState['content']);

                                                    return newState;
                                                });
                                            }}
                                            error={this.state.content.error}
                                            helperText={this.state.content.errorMessages.join('\n')}
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Stack>

                    <Grid container spacing={0} justifyContent="center" alignItems="center">
                        <Grid item xs={12} sx={{ p: 2 }}>
                            <Stack spacing={1} direction="row">
                                <Button variant="contained" type="submit" disabled={this.state.loading}>
                                    Submit
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>}
            </>
        );
    }
}

const CreateContent = withParams(ManageContent);
const EditContent = withParams(ManageContent);
const CopyContent = withParams(ManageContent);

export { CreateContent, EditContent, CopyContent };