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
import Box from '@mui/material/Box';
import TagIcon from '@mui/icons-material/Tag';
import Chip from '@mui/material/Chip';
import parse, { domToReact } from 'html-react-parser';
import AppBar from '@mui/material/AppBar';

/*function transformHTML(htmlString) {
    // Create a new DOM parser
    const parser = new DOMParser();

    // Parse the HTML string to a Document object
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Select all heading elements
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Iterate over each heading element and replace it
    headings.forEach(heading => {
        const newHeading = doc.createElement('Heading');
        newHeading.setAttribute('as', heading.tagName.toLowerCase());
        newHeading.textContent = heading.textContent;
        heading.replaceWith(newHeading);
    });

    // Serialize the modified Document object back to a string
    return new XMLSerializer().serializeToString(doc);
}*/

let COUNTER = 1;

// https://www.npmjs.com/package/html-react-parser
const transform = (node) => {
    if (node.type === 'tag' && node.name.match(/^h[1-6]$/)) {
        const level = node.name.charAt(1);
        return (
            <Heading as={`h${level}`}>
                {/*node.children[0].children[0].data*/}
                {domToReact(node.children)}
            </Heading>
        );
    }
};

// https://blog.openreplay.com/creating-a-table-of-content-widget-in-react/
function useHeadings() {
    const [headings, setHeadings] = React.useState([]);

    React.useEffect(() => {
        const elements = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
            .filter((element) => element.id)
            .map((element) => ({
                id: element.id,
                text: element.textContent ?? "",
                level: Number(element.tagName.substring(1))
            }));
        setHeadings(elements);
    }, []);

    return headings;
}

function getId(children) {
    return `heading-${COUNTER++}`;
    /*return children
        .split(" ")
        .map((word) => word.toLowerCase())
        .join("-")*/;
}

function Heading({ children, id, as: Element, ...props }) {
    const theId = id ?? getId(children);
    return (
        React.createElement(Element, { id: theId, ...props }, children)
    );
}

function useScrollSpy(ids, options) {
    const [activeId, setActiveId] = React.useState();
    const observer = React.useRef();
    React.useEffect(() => {
        const elements = ids.map((id) => document.getElementById(id));
        observer.current?.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry?.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, options);
        elements.forEach((el) => {
            if (el) {
                observer.current?.observe(el);
            }
        });
        return () => observer.current?.disconnect();
    }, [ids, options]);
    return activeId;
}

function TableOfContent() {
    const headings = useHeadings();
    const activeId = useScrollSpy(
        headings.map(({ id }) => id),
        { rootMargin: "0% 0% -25% 0%" }
    );
    return (
        <nav className="toc">
            <h2>Table of contents</h2>
            <ul>
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            style={{
                                marginLeft: `${heading.level - 1}em`,
                                fontWeight: activeId === heading.id ? "bold" : "normal"
                            }}
                            //href={`#${heading.id}`}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}

class Content extends React.Component {

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
            dialog: {
                title: "Confirm action",
                description: "Please confirm your action",
                isDialogOpen: false,
                handleAgree: () => { },
            },
            title: null,
            content: null,
            tags: []
        }
    }

    componentDidMount() {
        console.log('componentDidMount');

        if (this.state.loading) {
            return;
        }

        let contentId = this.props.params.viewContentId;

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

                            newState['title'] = data['title'];
                            newState['content'] = data['content'];
                            newState['tags'] = data['tags'];
                            newState['loading'] = false;

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

    render() {

        const content = this.state.content ? parse(this.state.content, { replace: transform }) : <></>;

        return (
            <>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={this.state.loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>

                <h1>Reading: {this.state.title}</h1>

                <Stack spacing={2} direction="column">
                    <Stack spacing={1} direction="row">
                        {this.state.tags.map((tag, index) =>
                            <Chip key={'tag_' + index} icon={<TagIcon />} size="small" label={tag} style={{ textTransform: 'lowercase' }} />
                        )}
                    </Stack>

                    <Paper elevation={5}>
                    
                        <Grid container spacing={0} justifyContent="flex-start" alignItems="flex-start">
                        
                            <Grid item xs={12}>
                            
                                <Stack spacing={2} direction="row" sx={{ p: 2 }}>
                                    <Box sx={{maxWidth: '80%', minWidth: '80%'}}>
                                        <article>{content}</article>
                                    </Box>

                                    <Box sx={{maxWidth: '20%', minWidth: '20%', backgroundColor: 'rgb(247, 247, 247)'}}>
                                        {this.state.content && <TableOfContent />}
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                </Stack>
            </>
        );
    }
}

const ViewContent = withParams(Content);

export default ViewContent;