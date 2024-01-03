import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import Button from '@mui/material/Button';
//import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import Chat from './Chat';
import Grid from '@mui/material/Grid';
import { CODE_URL } from './Urls';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import IdTokenContext from './IdTokenContext';
import Stack from '@mui/material/Stack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CodeIcon from '@mui/icons-material/Code';
import FeedbackIcon from '@mui/icons-material/Feedback';
import OutputIcon from '@mui/icons-material/Output';
import CloseIcon from '@mui/icons-material/Close';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';

import { WebSocketProvider, WebSocketContext } from './WebSocketContext'
// https://monaco-react.surenatoyan.com/

import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function toBase64(str) {
  let utf8Encoder = new TextEncoder();
  let utf8Bytes = utf8Encoder.encode(str);
  let base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 1 }}>
        {children}
      </Box>
    </div>
  );
}

class App extends React.Component {

  static contextType = IdTokenContext;

  constructor(props) {
    super(props);

    this.onSolved = this.onSolved.bind(this);
    this.onNotSolved = this.onNotSolved.bind(this);

    this.state = {
      view: 'code-view',
      code: props.solution ? props.solution : props.code,
      solution: props.solution,
      description: props.description,
      //challenge: props.challenge,
      stdout: '',
      asserts: { 'passed': [], 'failed': [] },
      loading: false,
      monaco: null,
      editor: null,
      alerts: [],
      tab: 0, codeTab: 0,
      messageInput: '',
      feedbackTag: 0,
      onSolvedCallback: props.onSolved ? props.onSolved : this.onSolved,
      onNotSolvedCallback: props.onNotSolved ? props.onNotSolved : this.onNotSolved,
      showSolvedAlert: false,
      showUnsolvedAlert: false
    }

    this.editorDidMount = this.editorDidMount.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onTest = this.onTest.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onExecute = this.onExecute.bind(this);
    this.onTabChange = this.onTabChange.bind(this);
    this.onCodeTabChange = this.onCodeTabChange.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onViewChange = this.onViewChange.bind(this);
    this.onClearOutput = this.onClearOutput.bind(this);
    this.onFeedbackTabChange = this.onFeedbackTabChange.bind(this);
  }

  onSolved() {
    console.log('onSolved!2');

    this.setState((prevState) => {
      return { ...prevState, showSolvedAlert: true };
    });
  }

  onNotSolved() {
    console.log('onNotSolved!2');
    this.setState((prevState) => {
      return { ...prevState, showUnsolvedAlert: true };
    });
  }

  componentDidMount() {
    const idToken = this.context.jwtToken;
    console.log('idToken!', idToken);

    console.log('App: mounted');

    setInterval(() => {
      const chatHeight = document.getElementById('chat').clientHeight;
      if (this.state.chatHeight !== chatHeight) {
        console.log('changing chat height', chatHeight);
        this.setState((prevState) => {
          return { ...prevState, chatHeight: chatHeight };
        });
      }
    }, 1000);
  }

  onFeedbackTabChange(e, value) {
    console.log('feedback-tab-change', value);

    this.setState((prevState) => {
      return ({
        ...prevState,
        feedbackTag: value
      });
    });
  }

  editorDidMount(editor, monaco) {

    this.setState((prevState) => {
      return ({
        ...prevState,
        monaco: monaco,
        editor: editor
      });
    });

    editor.focus();

    var KM = monaco.KeyMod;
    var KC = monaco.KeyCode;
    let self = this;
    editor.addCommand(KM.chord(KM.CtrlCmd | KC.Enter), function () {
      self.onExecute();
    });

    //window.addEventListener('resize', () => editor.layout());

    setInterval(() => {
      editor.layout();
    }, 100);

    monaco.editor.defineTheme("myTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        //"editor.foreground": "#000000",
        "editor.background": "#27374D",
        //"editorCursor.foreground": "#8B0000",
        "editor.lineHighlightBackground": "#27374D",
        //"editorLineNumber.foreground": "#008800",
        //"editor.selectionBackground": "#88000030",
        //"editor.inactiveSelectionBackground": "#88000015",
      },
    });
    //monaco.editor.setTheme("myTheme");
  }

  onClearOutput() {
    this.setState((prevState) => {
      return ({
        ...prevState,
        stdout: ''
      });
    });
  }

  onViewChange(e, newValue) {
    //console.log('newValue', newValue);

    this.setState((prevState) => {
      return ({
        ...prevState,
        view: newValue
      });
    });
    //this.setState({view: newValue});
  }

  onChange(newValue, e) {
    //console.log('onChange', newValue, e);
    //this.setState({ code: newValue });
    this.setState((prevState) => {
      return ({
        ...prevState,
        code: newValue
      });
    });
  }

  onMessage() {
    //this.setState({ messageInput: "My current code:\n\n```\n" + this.state.code.trim() + "\n```" });
    navigator.clipboard.writeText("```\n" + this.state.code.trim() + "\n```");
  }

  onExecute() {
    this.onTest(false);
  }

  onSubmit() {
    this.onTest(true);
  }

  onTest(doSubmit) {
    //console.log('clicked', this.state.code, btoa(this.state.code))

    //this.setState({ loading: true });
    this.setState((prevState) => {
      return ({
        ...prevState,
        loading: true
      });
    });

    fetch(CODE_URL + '?challengeId=' + this.props.challenge + "&submit=" + doSubmit, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
      mode: 'cors',
      body: JSON.stringify({ code: toBase64(this.state.code) })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);

        let alerts = [];
        let markers = [];

        let result = data.result;

        if (result.issues) {
          for (let issue of result.issues.filter(issue => issue.type === 'CODE')) {
            markers.push({
              startLineNumber: issue.starLine,
              startColumn: issue.startColumn,
              message: issue.message,
              severity: issue.level === 'ERROR' ? this.state.monaco.MarkerSeverity.Error : this.state.monaco.MarkerSeverity.Warning
            });
          }

          for (let issue of result.issues.filter(issue => issue.type === 'ALERT')) {
            alerts.push({ text: issue.message, level: issue.level });
          }
        }

        // TODO: make it proper stoud, asserts json

        let stdout = undefined;
        let assertions = { 'passed': [], 'failed': [] };

        if (result.output) {
          stdout = result.output;
        }

        if (result.asserts) {
          assertions = result.asserts;
        }

        this.state.monaco.editor.setModelMarkers(this.state.editor.getModel(), "owner", markers);

        this.setState((prevState) => {
          return ({
            ...prevState,
            stdout: stdout, alerts: alerts, asserts: assertions
          });
        });

        if (doSubmit) {
          if (result.solved) {
            this.state.onSolvedCallback();
          } else {
            this.state.onNotSolvedCallback();
          }
        }
        //this.setState({ stdout: stdout, alerts: alerts, asserts: assertions });
      })
      .catch(() => this.setState((prevState) => {
        return ({
          ...prevState,
          stdout: undefined, asserts: { 'passed': [], 'failed': [] }
        });
      }))
      .finally(() => this.setState((prevState, newState) => {
        console.log('executing finally block', ((prevState.alerts !== undefined && prevState.alerts.length > 0) || ((prevState.asserts.failed !== undefined && prevState.asserts.failed.length > 0) || (prevState.asserts.passed != undefined && prevState.asserts.passed.length > 0))) ? 'feedback-view' : 'code-view');

        return ({
          ...prevState,
          loading: false,
          view: 'feedback-view',
          feedbackTag: doSubmit ? 0 : 1
        });
      }));
  }

  onTabChange(event, newValue) {
    //this.setState({ tab: newValue })
  }

  onCodeTabChange(event, newValue) {
    //this.setState({ codeTab: newValue })
  }

  render() {
    //console.log('this.props.code', this.props.code);
    //console.log('this.state.solution', this.state.solution);

    // Invoke this on reset:
    // console.log(this.state.editor.getModel().setValue(this.props.code));

    const code = this.state.code;//this.state.solution ? this.state.solution : this.state.code;

    const options = {
      selectOnLineNumbers: true,
      fontFamily: 'MonoLisa, Menlo, Monaco, "Courier New", monospace',
      fontSize: '16px',
      fontWeight: '100'
      /*theme: {
        base: "vs-dark", // can also be vs-dark or hc-black
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          {
            token: "comment",
            foreground: "ffa500",
            fontStyle: "italic underline",
          },
          { token: "comment.js", foreground: "008800", fontStyle: "bold" },
          { token: "comment.css", foreground: "0000ff" }, // will inherit fontStyle from `comment` above
        ],
        colors: {
          //"editor.foreground": "#000000",
          //"editor.background": "#27374D",
          //"editorCursor.foreground": "#8B0000",
          //"editor.lineHighlightBackground": "#0000FF20",
          //"editorLineNumber.foreground": "#008800",
          //"editor.selectionBackground": "#88000030",
          //"editor.inactiveSelectionBackground": "#88000015",
        }
      }*/
    };

    const editor = (
      <>
        <div className="editor">
          <Paper elevation={5} style={{ padding: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)', height: (this.state.chatHeight) + 'px' }}>
            <div className="exec-button">
              <Stack spacing={2} direction="row">
                <ButtonGroup variant="contained" aria-label="outlined primary button group">
                  <Button
                    variant="outlined"
                    disabled={this.state.loading}
                    onClick={this.onMessage}
                    endIcon={<ContentCopyIcon />}
                  >Copy</Button>

                  <Button
                    variant="outlined"
                    disabled={this.state.loading}
                    onClick={() => this.setState((prevState) => {
                      return ({
                        ...prevState,
                        view: 'code-view'
                      });
                    })}
                    endIcon={<ClearAllIcon />}
                  >Clear</Button>

                  <Button
                    variant="outlined"
                    disabled={this.state.loading}
                    onClick={() => this.state.editor.getModel().setValue(this.props.code)}
                    endIcon={<RestartAltIcon />}
                  >Restart</Button>

                  <Button
                    variant="contained"
                    disabled={this.state.loading}
                    endIcon={<PlayArrowIcon />}
                    onClick={this.onExecute}>Execute</Button>

                  <Button
                    variant="contained"
                    disabled={this.state.loading}
                    endIcon={<SendIcon />}
                    onClick={this.onSubmit}>Submit</Button>
                </ButtonGroup>
              </Stack>
            </div>

            {
              <>
                <Paper elevation={5} style={{ margin: '0 10px 10px 10px', height: (this.state.view === 'feedback-view' ? 'calc(75vh - 500px)' : 'calc(75vh - 4px)'), backgroundColor: 'black' }}>
                  <MonacoEditor
                    width="100%"
                    style={{ borderRadius: '5px' }}
                    //height={window.innerHeight - 300}
                    //height={this.state.stdout === '' ? "91.8%" : "50%"}
                    language="python"
                    //theme="vs-light"
                    theme="myTheme"
                    value={code}
                    options={options}
                    onChange={this.onChange}
                    editorDidMount={this.editorDidMount}
                  />
                </Paper>

                {this.state.view === 'feedback-view' && <>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={this.state.feedbackTag} onChange={this.onFeedbackTabChange}>
                      <Tab label="Feedback" />
                      <Tab label="Output" />
                    </Tabs>
                  </Box>

                  <div id="feedback-container">
                    <TabPanel value={this.state.feedbackTag} index={0}>
                      {/*backgroundColor: (this.state.asserts.failed != undefined && this.state.asserts.failed.length == 0 && this.state.asserts.passed != undefined && this.state.asserts.passed.length > 0 ? '#2e7d32' : '#ba000d')*/}
                      <div style={{ height: '404px', padding: '0 20px', overflow: 'auto', position: 'relative' }}>
                        {this.state.alerts && <div className="alerts">
                          {this.state.alerts.map((alert, index) => <Alert style={{ marginBottom: '5px' }} key={index} severity={alert.level === 'ERROR' ? 'error' : 'warning'}>{alert.text}</Alert>)}
                        </div>}

                        {(this.state.asserts.failed != undefined || this.state.asserts.passed != undefined) &&
                          <div className="asserts">
                            {this.state.asserts.failed && this.state.asserts.failed.map((assert, index) => <Alert style={{ marginBottom: '5px' }} key={index} severity='error'>{assert}</Alert>)}
                            {this.state.asserts.passed && this.state.asserts.passed.map((assert, index) => <Alert style={{ marginBottom: '5px' }} key={index} severity='success'>{assert}</Alert>)}
                          </div>
                        }
                      </div>
                    </TabPanel>
                    <TabPanel value={this.state.feedbackTag} index={1}>
                      <Paper elevation={5} style={{ height: '404px', backgroundColor: 'black', overflow: 'auto', position: 'relative' }}>
                        <pre className="stdout">{this.state.stdout}</pre>
                      </Paper>
                    </TabPanel>
                  </div>
                </>
                }
              </>}
          </Paper>
        </div>

        <div className="progress-bar">
          {this.state.loading && <LinearProgress />}
        </div>
      </>
    );

    return (
      <div>
        <Snackbar open={this.state.showSolvedAlert} autoHideDuration={6000} onClose={() => this.setState({ showSolvedAlert: false })}>
          <Alert onClose={() => this.setState({ showSolvedAlert: false })} severity="success" sx={{ width: '100%' }}>
            Problem solved successfully!
          </Alert>
        </Snackbar>
        <Snackbar open={this.state.showUnsolvedAlert} autoHideDuration={6000} onClose={() => this.setState({ showUnsolvedAlert: false })}>
          <Alert onClose={() => this.setState({ showUnsolvedAlert: false })} severity="error" sx={{ width: '100%' }}>
            Solution has problems
          </Alert>
        </Snackbar>
        <Grid container spacing={2}>
          <Grid item xs={6} className="problem-left">
            <WebSocketContext.Consumer>
              {socket => (
                <Chat socket={socket} 
                      challenge={this.props.challenge} 
                      description={this.props.description} 
                      input={this.state.messageInput} 
                      userCode={() => {return this.state.code}}
                />
              )}
            </WebSocketContext.Consumer>
          </Grid>
          <Grid item xs={6} className="problem-right">
                {editor}
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default App;
