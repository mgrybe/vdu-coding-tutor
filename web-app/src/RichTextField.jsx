import React from 'react';

import { EditorState, ContentState, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import './Editor.css';
//import { draftToMarkdown, markdownToDraft } from 'markdown-draft-js';
//import { mdToDraftjs, draftjsToMd } from 'draftjs-md-converter';
//import { stateFromMarkdown } from 'draft-js-import-markdown';
//import { stateToMarkdown } from "draft-js-export-markdown";

import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import TextField from '@mui/material/TextField';

// https://www.npmjs.com/package/markdown-draft-js
// https://www.npmjs.com/package//react-draft-wysiwyg
// https://draftjs.org/docs/api-reference-editor-change-type
// https://www.npmjs.com/package/markdown-draft-js

// https://github.com/jpuri/react-draft-wysiwyg/issues/364
// https://github.com/kadikraman/draftjs-md-converter

// https://github.com/sstur/draft-js-utils/tree/master/packages/draft-js-export-markdown
// https://github.com/sstur/draft-js-utils/tree/master/packages/draft-js-import-markdown

// https://github.com/sstur/draft-js-utils/blob/master/packages/draft-js-utils/src/Constants.js

const MyInputComponent = React.forwardRef((props, ref) => {
    const { component: Component, onChange, ...other } = props;

    //setTimeout(() => props.onBlur(), 2000);

    const theInput = {
        focus: () => {
            // logic to focus the rendered component from 3rd party belongs here
        },
        // hiding the value e.g. react-stripe-elements
        value: undefined
    };

    // implement `InputElement` interface
    React.useImperativeHandle(ref, () => (theInput));

    // `Component` will be your `SomeThirdPartyComponent` from below
    return (
        <div style={{ paddingLeft: '14px', paddingRight: '14px', paddingTop: '5px', paddingBottom: '0px' }}>
            <TextEditor
                {...other}
                onChange={(value) => {
                    props.onChange({
                        target: {
                            name: props.name,
                            value: value,
                        }
                    });
                    theInput.value = value;
                }}
            />
        </div>
    );
});

const MyPreviewInputComponent = React.forwardRef((props, ref) => {
    const { component: Component, onChange, ...other } = props;

    //setTimeout(() => props.onBlur(), 2000);

    const theInput = {
        focus: () => {
            // logic to focus the rendered component from 3rd party belongs here
        },
        // hiding the value e.g. react-stripe-elements
        value: undefined
    };

    // implement `InputElement` interface
    React.useImperativeHandle(ref, () => (theInput));

    // `Component` will be your `SomeThirdPartyComponent` from below
    return (
        <div style={{ paddingLeft: '14px', paddingRight: '14px', paddingTop: '0px', paddingBottom: '0px' }}>
            <TextEditor
                {...other}
                onChange={(value) => {
                    props.onChange({
                        target: {
                            name: props.name,
                            value: value,
                        }
                    });
                    theInput.value = value;
                }}
            />
        </div>
    );
});

class TextEditor extends React.Component {

    constructor(props) {
        super(props);

        let editorState = EditorState.createEmpty();

        // Convert input from markdown to draftjs state
        const html = props.value;

        console.log('initializing with html', html, props);

        if (html) {
            const contentBlock = htmlToDraft(html);

            if (contentBlock) {
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                editorState = EditorState.createWithContent(contentState);
            }
        }

        this.state = {
            editorState: editorState
        };
    }

    onEditorStateChange = (editorState) => {
        this.setState({
            editorState,
        });

        const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        this.props.onChange(html);
        console.log('rich:html', html);
    };

    render() {
        const { editorState } = this.state;
        return (
            <Editor
                readOnly={this.props.readOnly}
                toolbarHidden={this.props.toolbarHidden}
                editorState={editorState}
                wrapperClassName="demo-wrapper"
                editorClassName="demo-editor"
                onEditorStateChange={this.onEditorStateChange}
            />
        )
    }
}

function RichTextField(props) {

    return (
        <TextField
            {...props}
            InputProps={{
                inputComponent: MyInputComponent,
                /*inputProps: {
                    focused: true
                }*/
            }}
            onFocus={() => console.log('focused')}
            InputLabelProps={{
                /*focused: true,
                disabled: true,
                disableAnimation: true,*/
                shrink: true
            }}
        />
    );
}

export function RichTextPreviewField(props) {

    return (
        <TextField
            {...props}
            InputProps={{
                inputComponent: MyPreviewInputComponent,
                inputProps: {
                    readOnly: true,
                    toolbarHidden: true
                }
            }}
        />
    );
}

export default RichTextField;