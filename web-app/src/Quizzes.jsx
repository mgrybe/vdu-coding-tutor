import React from 'react';
import { QUIZZES_URL } from './Urls';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouteLink } from "react-router-dom";
import Link from '@mui/material/Link';
import IdTokenContext from './IdTokenContext';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SpaIcon from '@mui/icons-material/Spa';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import TagIcon from '@mui/icons-material/Tag';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DifficultyChip from './DifficultyChip';

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

class Quizzes extends React.Component {
  static contextType = IdTokenContext;

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      removed: false,
      failed: false,
      quizzes: [],
      filterTerm: '',
      dialog: {
        title: "Confirm action",
        description: "Please confirm your action",
        isDialogOpen: false,
        handleAgree: () => { },

      }
    }

    this.onReload = this.onReload.bind(this);
    this.onRemove = this.onRemove.bind(this);
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

    return fetch(QUIZZES_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
      mode: 'cors'
    })
      .then(response => response.json())
      .then(data => {
        console.log('quizzes', data);

        this.setState({ quizzes: data.quizzes });
      })
      .catch(() => this.setState({ failed: true }))
      .finally(() => this.setState({ loading: false }));
  }

  getQuizz(quizzId) {
    return fetch(QUIZZES_URL + "?quizzId=" + quizzId, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
      mode: 'cors'
    });
  }

  queryUntilDeleted(quizzId, retries = 5, callback) {
    if (retries === 0) {
      console.log('failed');
      callback();
      return;
    }

    console.log('querying if deleted');

    this.getQuizz(quizzId)
      .then(response => {
        if (response.status === 200) {
          // If the resource was found, schedule the next attempt in 2 seconds
          setTimeout(() => this.queryUntilDeleted(quizzId, retries - 1, callback), 2000);
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

  onRemove(quizzId, title) {
    this.openConfirmDialog({ description: `Do you really want to delete quizz: "${title}"` }, () => {
      this.setState((prevState) => {

        fetch(QUIZZES_URL + "?quizzId=" + quizzId, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
          mode: 'cors'
        })
          //.then(response => response.json())
          .then(response => {
            console.log('deleted');
            setTimeout(() => {
              this.queryUntilDeleted(quizzId, 5, () => {
                this.onReload().finally(() => this.setState({ removed: true }));
              });
            }, 1000);
          })
          .catch(() => this.setState({ loading: false, failed: true }));

        return ({
          ...prevState,
          loading: true
        });
      });
    });
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

  render() {
    return (
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
        <Snackbar open={this.state.removed} autoHideDuration={6000} onClose={() => this.setState({ removed: false })}>
          <Alert onClose={() => this.setState({ removed: false })} severity="success" sx={{ width: '100%' }}>
            Quizz removed successfully!
          </Alert>
        </Snackbar>
        <Snackbar open={this.state.failed} autoHideDuration={6000} onClose={() => this.setState({ failed: false })}>
          <Alert onClose={() => this.setState({ failed: false })} severity="error" sx={{ width: '100%' }}>
          Quizz removal failed
          </Alert>
        </Snackbar>
        <Typography variant="h2" component="h2" >
          Quizzes
        </Typography>
        <div>
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

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  {/*<TableCell align="left">Tags</TableCell>
                  <TableCell align="left">Difficulty</TableCell>*/}
                  <TableCell align="left">Status</TableCell>
                  <TableCell align="left">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.filterItems(this.state.quizzes, this.state.filterTerm).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })).map((quizz, index) => (
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
                    {/*<TableCell align="left">
                      <Stack spacing={1} direction="row">
                        {problem.tags.map((tag, index) =>
                          <Chip key={'tag_' + index} icon={<TagIcon />} size="small" label={tag} style={{ textTransform: 'lowercase' }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="left">
                      <DifficultyChip difficulty={problem.difficulty} />
                    </TableCell>
                    
                    */}
                    <TableCell align="left">{quizz.solved ? <Chip icon={<TaskAltIcon />} size="small" label={`solved (${quizz.solved.score} / ${quizz.totalScore})`} color="success" /> : <span />}</TableCell>
                    <TableCell align="left">
                      <RouteLink to={`/edit-quizz/${quizz.id}`} style={{ textDecoration: 'none' }}>
                        <IconButton disabled={this.state.loading} color="primary"><ModeEditIcon /></IconButton>
                      </RouteLink>
                      <RouteLink to={`/copy-quizz/${quizz.id}`} style={{ textDecoration: 'none' }}>
                        <IconButton disabled={this.state.loading} color="primary"><ContentCopyIcon /></IconButton>
                      </RouteLink>
                      <IconButton disabled={this.state.loading} color="primary" onClick={() => this.onRemove(quizz.id, quizz.title)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    );
  }
}

export default Quizzes;