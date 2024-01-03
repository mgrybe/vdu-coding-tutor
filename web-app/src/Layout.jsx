import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import { Outlet, Link } from "react-router-dom";
import LogoutIcon from '@mui/icons-material/Logout';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { WebSocketProvider, WebSocketContext } from './WebSocketContext'
import SchoolIcon from '@mui/icons-material/School';
import { PyPalIcon } from './Icons';

function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

function stringAvatar(name, picture) {
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
        src: picture
    };
}

const pages = [
    {
        'title': 'Home',
        'href': '/home'
    },
    {
        'title': 'Tasks',
        'href': '/problems'
    },
    {
        'title': 'Modules',
        'href': '/modules'
    },
    {
        'title': 'Quizzes',
        'href': '/quizzes'
    },
    {
        'title': 'Content',
        'href': '/content'
    },
    {
        'title': 'Create task',
        'href': '/create-problem'
    },
    {
        'title': 'Create module',
        'href': '/create-module'
    },
    {
        'title': 'Create quizz',
        'href': '/create-quizz'
    },
    {
        'title': 'Create content',
        'href': '/create-content'
    },
];
const settings = [];

const theme = createTheme({
    status: {
        danger: '#e53e3e',
    },
    palette: {
        primary: {
            main: '#64748B',
            darker: '#053e85',
            //contrastText: 'red'
        },
        secondary: {
            //main: '#64748B',
            main: 'rgba(255, 255, 255, 0.9)',
            //contrastText: 'red'
        },
        neutral: {
            main: '#64748B',
            //contrastText: 'red'
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        poster: {
            fontSize: '4rem',
            color: 'red',
        },
    },
});

class Layout extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            time: null
        }
    }

    componentDidMount() {
        setInterval(() => this.setState((prevState) => {
            return ({
                ...prevState,
                time: new Date()
            });
        }), 1000);
    }

    render() {
        return (
            <div>
                <ThemeProvider theme={theme}>
                    <AppBar position="static" color="secondary">
                        <Container maxWidth="xxl">
                            <Toolbar disableGutters>
                                <WebSocketContext.Consumer>
                                    {socket => (
                                        <React.Fragment>
                                            <PyPalIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />

                                            <Typography
                                                //style={{ color: socket.isReady() ? '#2e7d32' : '' }}
                                                variant="h6"
                                                noWrap
                                                component="span"
                                                href="/"
                                                sx={{
                                                    mr: 2,
                                                    display: { xs: 'none', md: 'flex' },
                                                    fontFamily: 'monospace',
                                                    fontWeight: 700,
                                                    color: 'inherit',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                <span className={socket.isReady() ? 'glow' : ''}>PyPal</span>
                                            </Typography>
                                        </React.Fragment>

                                    )}
                                </WebSocketContext.Consumer>



                                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

                                    {pages.map((page) => (
                                        <Link key={page.title} to={page.href} style={{ textDecoration: 'none' }}>
                                            <Button key={page.title}
                                                sx={{ my: 2, color: 'rgb(35, 39, 47)', display: 'block' }}
                                            >{page.title}</Button>
                                        </Link>
                                    ))}
                                </Box>

                                <Box sx={{ flexGrow: 0 }}>
                                    <IconButton sx={{ p: 0 }}>
                                        <Avatar {...stringAvatar(this.props.name, this.props.user.picture)} />
                                    </IconButton>
                                </Box>

                                <Box sx={{ flexGrow: 0, marginLeft: 5 }}>
                                    <IconButton sx={{ p: 0 }} onClick={this.props.signOut}>
                                        <LogoutIcon />
                                    </IconButton>
                                </Box>
                            </Toolbar>
                        </Container>
                    </AppBar>

                    <div className='page'><Outlet /></div>
                </ThemeProvider>
            </div>
        );
    }
}
export default Layout;