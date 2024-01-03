import React from 'react';
import { useParams } from "react-router-dom";
import { PROBLEMS_URL, MODULES_URL, QUIZZES_URL, CONTENTS_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import Typography from '@mui/material/Typography';
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

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class ManageModule extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            moduleId: null,
            action: 'CREATE',
            loading: false,
            failed: false,
            submitted: false,
            
            problems: [],
            selected: [],
            problemsFilterTerm: '',
            selectedFilterTerm: '',

            contents: [],
            selectedContents: [],
            contentsFilterTerm: '',
            selectedContentsFilterTerm: '',

            quizzes: [],
            selectedQuizzes: [],
            quizzesFilterTerm: '',
            selectedQuizzesFilterTerm: '',
            
            module: {
                id: undefined,
                version: '0',
                name: '',
                summary: '',
                description: '',
                difficulty: '',
                tags: [],
                problems: [],
                achievement: ''
            }
        }

        this.handleToggleAll = this.handleToggleAll.bind(this);
        this.numberOfChecked = this.numberOfChecked.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleCheckedLeft = this.handleCheckedLeft.bind(this);
        this.handleCheckedRight = this.handleCheckedRight.bind(this);
        this.applyFilter = this.applyFilter.bind(this);
        this.filterItems = this.filterItems.bind(this);
        this.onCreate = this.onCreate.bind(this);

        this.setFieldValue = this.setFieldValue.bind(this);
    }

    setFieldValue(fieldId, value) {
        this.setState((prevState) => {

            const newState = {
                ...prevState
            };

            newState['module'][fieldId] = value;

            return newState;
        });
    }

    filterItems(items, term) {
        return items.filter(item => item.title.toLowerCase().includes(term.toLowerCase()));
    }

    getModule(moduleId) {
        console.log(`getModule(${moduleId})`);

        return fetch(MODULES_URL + "?moduleId=" + moduleId, {
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

    queryUntil(moduleId, retries = 5, predicate, callback) {
        if (retries === 0) {
            console.log('failed');
            callback();
            return;
        }

        console.log('querying until');

        this.getModule(moduleId)
            .then(module => {
                console.log('Existing', this.state.module, 'New', module);

                if (predicate(module)) {
                    // If the resource was found, schedule the next attempt in 2 seconds
                    setTimeout(() => this.queryUntil(moduleId, retries - 1, predicate, callback), 2000);
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

        const module = {
            ...this.state.module
        };

        module['contents'] = this.state.selectedContents.map(item => item.id);
        module['problems'] = this.state.selected.map(item => item.id);
        module['quizzes'] = this.state.selectedQuizzes.map(item => item.id);

        console.log('Creating module', module);

        this.setState((prevState) => {

            fetch(MODULES_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors',
                body: JSON.stringify(module)
            })
                .then(response => response.json())
                .then(module => {
                    console.log('created', module);

                    // Querying while module is null or version is not bumped
                    this.queryUntil(module.id, 5, (module) => module === null || parseInt(module.version) <= parseInt(this.state.module.version), () => {
                        this.setState((prevState) => {
                            return { ...prevState, submitted: true, loading: false };
                        });
                    });
                })
                .catch((error) => {
                    console.error(`Module create error: ${error.message}`);

                    this.setState((prevState) => {
                        return { ...prevState, failed: true, loading: false };
                    });
                });

            return ({
                ...prevState,
                loading: true
            });
        });
    }

    applyFilter(itemsId, term) {
        this.setState((prevState) => {

            const newState = {
                ...prevState
            };

            newState[`${itemsId}FilterTerm`] = term;

            console.log('filter', newState);

            return newState;
        });
    }

    handleCheckedLeft(leftItemsId, rightItemsId) {
        this.setState((prevState) => {
            const problems = prevState[leftItemsId];
            const selected = prevState[rightItemsId];

            const checked = problems.filter(item => item.checked).map(item => {
                item.checked = false;
                return item;
            });

            const newState = {...prevState};

            newState[leftItemsId] = problems.filter(item => checked.indexOf(item) === -1);
            newState[rightItemsId] =  [...selected, ...checked];

            return newState;
        });
    }

    handleCheckedRight(leftItemsId, rightItemsId) {
        this.setState((prevState) => {
            const problems = prevState[leftItemsId];
            const selected = prevState[rightItemsId];

            const checked = selected.filter(item => item.checked).map(item => {
                item.checked = false;
                return item;
            });

            const newState = {...prevState};

            newState[leftItemsId] = [...problems, ...checked];
            newState[rightItemsId] = selected.filter(item => checked.indexOf(item) === -1);

            return newState;
        });
    }

    handleToggleAll(itemsId, items) {
        console.log('handleToggle');

        /*if (!items) {
            return;
        }*/

        this.setState((prevState) => {

            const problems = prevState[itemsId];

            const toggledItems = problems.map(item => {
                if (items.indexOf(item) !== -1) {
                    item.checked = !item.checked;
                }
                return item;
            });

            const newState = {
                ...prevState
            };

            newState[itemsId] = toggledItems;

            return newState;
        });
    }

    handleToggle(itemsId, item) {
        this.setState((prevState) => {
            const newState = {
                ...prevState
            };

            newState[itemsId].map(val => {
                if (val.id === item.id) {
                    val.checked = !val.checked;
                }
            });

            return newState;
        });
    }

    numberOfChecked(items) {
        return items.filter(item => item.checked).length;
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let moduleId = this.props.params.editModuleId;

        if (moduleId) {
            this.setState({ action: 'EDIT' });
        } else {
            moduleId = this.props.params.copyModuleId;

            if (moduleId) {
                this.setState({ action: 'COPY' });
            }
        }

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
                    problems: data.problems.map(item => {
                        item.checked = false;
                        return item;
                    })
                })
            });

        promise = promise.then(() => {
            return fetch(QUIZZES_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('quizes', data);

                    this.setState((prevState) => {
                        const newState = {...prevState};

                        newState['quizzes'] = data['quizzes'];

                        return newState;
                    });
                });
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

                    this.setState((prevState) => {
                        const newState = {...prevState};

                        newState['contents'] = data['contents'];

                        return newState;
                    });
                });
        });

        if (moduleId) {
            this.setState({ moduleId: moduleId });

            promise = promise.then(() => {
                return fetch(MODULES_URL + "?moduleId=" + moduleId + "&detailLevel=FULL", {
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

                            const problems = newState['problems'];
                            newState['problems'] = problems.filter((problem) => data['problems'].indexOf(problem['id']) === -1);
                            newState['selected'] = problems.filter((problem) => data['problems'].indexOf(problem['id']) !== -1);

                            if (data['contents']) {
                                const contents = newState['contents'];
                                newState['contents'] = contents.filter((content) => data['contents'].indexOf(content['id']) === -1);
                                newState['selectedContents'] = contents.filter((content) => data['contents'].indexOf(content['id']) !== -1);
                            }
                            
                            if (data['quizzes']) {
                                const quizzes = newState['quizzes'];
                                newState['quizzes'] = quizzes.filter((quizz) => data['quizzes'].indexOf(quizz['id']) === -1);
                                newState['selectedQuizzes'] = quizzes.filter((quizz) => data['quizzes'].indexOf(quizz['id']) !== -1);
                            }
                            
                            if (this.props.params.copyModuleId) {
                                delete newState.module['id'];
                            }

                            return newState;
                        });
                    })
                    .finally(() => this.setState((prevState) => { return { prevState, ...{ loading: false } } }));
            });
        }

        promise.finally(() => this.setState({ loading: false }));
    }

    render() {
        const customList = (title, itemsId, items) => (
            <Card>
                <CardHeader
                    sx={{ px: 2, py: 1 }}
                    avatar={
                        <>
                            <OutlinedInput
                                size="small"
                                id="outlined-start-adornment"
                                sx={{ m: 1, width: 'auto', marginLeft: '5px', marginRight: '5px' }}
                                onChange={(event) => {
                                    this.applyFilter(itemsId, event.target.value);
                                }}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <SearchIcon />
                                    </InputAdornment>
                                }
                            />
                            <Checkbox
                                onClick={() => this.handleToggleAll(itemsId, items)}
                                checked={this.numberOfChecked(items) === items.length && items.length !== 0}
                                indeterminate={
                                    this.numberOfChecked(items) !== items.length && this.numberOfChecked(items) !== 0
                                }
                                disabled={items.length === 0}
                                inputProps={{
                                    'aria-label': 'all items selected',
                                }}
                            />
                        </>
                    }
                    title={title}
                    subheader={`${this.numberOfChecked(items)}/${items.length} selected`}
                />
                <Divider />
                <List dense component="div" role="list" sx={{ height: 500, overflow: 'auto' }}>
                    {items.map((value, index) => {
                        const labelId = `transfer-list-item-${value.id}-label-${itemsId}`;

                        return (
                            <ListItem
                                key={value.id}
                                role="listitem"
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        onClick={() => this.handleToggle(itemsId, value)}
                                        checked={value.checked !== undefined && value.checked}
                                        tabIndex={-1}
                                        disableRipple
                                        inputProps={{
                                            'aria-labelledby': labelId,
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText style={{ cursor: 'pointer' }} onClick={() => this.handleToggle(itemsId, value)} id={labelId} primary={`${value.title}`} />
                                <IconButton disabled={index === 0} color="primary" onClick={(event) => {
                                    event.preventDefault();

                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        const temp = newState[itemsId][index];
                                        newState[itemsId][index] = newState[itemsId][index - 1]
                                        newState[itemsId][index - 1] = temp;

                                        return newState;
                                    });
                                }}>
                                    <ArrowCircleUpIcon />
                                </IconButton>
                                <IconButton disabled={items.length - 1 === index} color="primary" onClick={(event) => {
                                    event.preventDefault();

                                    this.setState((prevState) => {
                                        const newState = { ...prevState };

                                        const temp = newState[itemsId][index];
                                        newState[itemsId][index] = newState[itemsId][index + 1]
                                        newState[itemsId][index + 1] = temp;

                                        return newState;
                                    });
                                }}>
                                    <ArrowCircleDownIcon />
                                </IconButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Card>
        );

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
                        Module submitted successfully!
                    </Alert>
                </Snackbar>
                <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
                    <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
                        Module submissions failed
                    </Alert>
                </Snackbar>
                <Typography variant="h2" component="h2" >
                    {this.state.action === 'CREATE' ? 'Create Module' : (this.state.action === 'EDIT' ? 'Edit Module' : (this.state.action === 'COPY' ? 'Copy Module' : ''))}
                </Typography>
                <div>
                    <Paper elevation={5}>
                        <form onSubmit={(event) => this.onCreate(event)}>
                            <Grid container spacing={0} justifyContent="center" alignItems="center">
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.module.name}
                                        required
                                        label="Module name"
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('name', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.module.summary}
                                        required
                                        label="Module summary"
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('summary', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.module.description}
                                        required
                                        label="Module description"
                                        multiline
                                        rows={4}
                                        id="outlined-start-adornment"
                                        onChange={(event) => {
                                            this.setFieldValue('description', event.target.value);
                                        }}
                                        sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <TextField
                                        value={this.state.module.difficulty}
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
                                    <FormControl fullWidth>
                                        <TextField
                                            value={this.state.module.tags.join('\n')}
                                            required
                                            label="Tags (one tag per line)"
                                            multiline
                                            rows={4}
                                            id="outlined-start-adornment"
                                            onChange={(event) => {
                                                this.setFieldValue('tags', event.target.value.split('\n'));
                                            }}
                                            sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} className="problem-right">
                                    <FormControl fullWidth>
                                        <TextField
                                            value={this.state.module.achievement}
                                            required
                                            label="Achievement badge title"
                                            inputProps={{ maxLength: 30 }}
                                            id="outlined-start-adornment"
                                            onChange={(event) => {
                                                this.setFieldValue('achievement', event.target.value);
                                            }}
                                            sx={{ m: 1, width: 'calc(100% - 16px)' }}
                                        />
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} className="problem-right" sx={{ m: 1, width: 'calc(100% - 16px)' }}>

                                    <h2>Content</h2>

                                    <Grid container direction="row" alignItems="center">
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'contents', this.filterItems(this.state.contents, this.state.contentsFilterTerm))}
                                        </Grid>
                                        <Grid item xs={2} className="problem-right">
                                            <Grid container direction="column" alignItems="center">
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedLeft('contents', 'selectedContents')}
                                                    disabled={this.numberOfChecked(this.state.contents) === 0}
                                                    aria-label="move selected right"
                                                >
                                                    &gt;
                                                </Button>
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedRight('contents', 'selectedContents')}
                                                    disabled={this.numberOfChecked(this.state.selectedContents) === 0}
                                                    aria-label="move selected left"
                                                >
                                                    &lt;
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'selectedContents', this.filterItems(this.state.selectedContents, this.state.selectedContentsFilterTerm))}
                                        </Grid>
                                    </Grid>
                                </Grid>


                                <Grid item xs={12} className="problem-right" sx={{ m: 1, width: 'calc(100% - 16px)' }}>

                                    <h2>Tasks</h2>

                                    <Grid container direction="row" alignItems="center">
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'problems', this.filterItems(this.state.problems, this.state.problemsFilterTerm))}
                                        </Grid>
                                        <Grid item xs={2} className="problem-right">
                                            <Grid container direction="column" alignItems="center">
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedLeft('problems', 'selected')}
                                                    disabled={this.numberOfChecked(this.state.problems) === 0}
                                                    aria-label="move selected right"
                                                >
                                                    &gt;
                                                </Button>
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedRight('problems', 'selected')}
                                                    disabled={this.numberOfChecked(this.state.selected) === 0}
                                                    aria-label="move selected left"
                                                >
                                                    &lt;
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'selected', this.filterItems(this.state.selected, this.state.selectedFilterTerm))}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12} className="problem-right" sx={{ m: 1, width: 'calc(100% - 16px)' }}>
                                    
                                    <h2>Quizzes</h2>

                                    <Grid container direction="row" alignItems="center">
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'quizzes', this.filterItems(this.state.quizzes, this.state.quizzesFilterTerm))}
                                        </Grid>
                                        <Grid item xs={2} className="problem-right">
                                            <Grid container direction="column" alignItems="center">
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedLeft('quizzes', 'selectedQuizzes')}
                                                    disabled={this.numberOfChecked(this.state.quizzes) === 0}
                                                    aria-label="move selected right"
                                                >
                                                    &gt;
                                                </Button>
                                                <Button
                                                    sx={{ my: 0.5 }}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => this.handleCheckedRight('quizzes', 'selectedQuizzes')}
                                                    disabled={this.numberOfChecked(this.state.selectedQuizzes) === 0}
                                                    aria-label="move selected left"
                                                >
                                                    &lt;
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={5} className="problem-right">
                                            {customList('Selected', 'selectedQuizzes', this.filterItems(this.state.selectedQuizzes, this.state.selectedQuizzesFilterTerm))}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item xs={12} className="problem-right" sx={{ p: 2 }}>
                                <Button variant="contained" type="submit" disabled={this.state.loading}>
                                    Submit
                                </Button>
                            </Grid>
                        </form>
                    </Paper>
                </div>
            </div>
        );
    }
}

const CreateModule = withParams(ManageModule);
const EditModule = withParams(ManageModule);
const CopyModule = withParams(ManageModule);

//export default withParams(CreateProblem);
export { CreateModule, EditModule, CopyModule };