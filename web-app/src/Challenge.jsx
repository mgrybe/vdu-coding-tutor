import React from 'react';
import { useParams } from "react-router-dom";
import { PROBLEMS_URL } from './Urls';
import App from './App';
import Typography from '@mui/material/Typography';
import IdTokenContext from './IdTokenContext';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Chip from '@mui/material/Chip';

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

class Challenge extends React.Component {

    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            chellengeId: '', description: ''
        }
    }

    componentDidMount() {
        let challengeId = this.props.params.challengeId;

        this.setState({ challengeId: challengeId, loading: true })

        fetch(PROBLEMS_URL + "?challengeId=" + challengeId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
            mode: 'cors'
        })
            .then(response => response.json())
            .then(data => {
                this.setState({ code: data.signature, name: data.name, description: data.description, solution: data.last_solution, solved: data.solved })
            })
            .catch(() => this.setState({ code: '', challengeId: '', name: '' }))
            .finally(() => this.setState({ loading: false }));
    }

    render() {
        const solution = this.state.solution ? this.state.solution.code : '';

        return (
            <>

                <Paper elevation={5} sx={{ marginBottom: 1, paddingBottom: 2, paddingLeft: '24px', paddingTop: 2 }}>

                    <Grid container spacing={0} justifyContent="left" alignItems="left">
                        <Grid item xs={12}>
                            <Typography variant="h5" component="h5" >
                                Task: {this.state.name} {this.state.solved ? <Chip icon={<TaskAltIcon />} label="solved" color="success" /> : <span />}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {!this.state.loading && <App code={this.state.code} solution={solution} challenge={this.state.challengeId} description={this.state.description} />}
            </>
        );
    }
}

export default withParams(Challenge);