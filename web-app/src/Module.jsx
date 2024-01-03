import React, { useState, useRef, useEffect } from 'react';
import { Link as RouteLink } from "react-router-dom";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

import ModeEditIcon from '@mui/icons-material/ModeEdit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import Tooltip from '@mui/material/Tooltip';

import { MODULES_URL, ENROLLMENT_URL } from './Urls';
import IdTokenContext from './IdTokenContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import DifficultyChip from './DifficultyChip';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CardHeader from '@mui/material/CardHeader';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

function formatDate(date) {
    let yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;  // getMonth() is zero-based
    let dd = date.getDate();

    // Ensure two digits
    mm = (mm < 10) ? '0' + mm : mm;
    dd = (dd < 10) ? '0' + dd : dd;

    return yyyy + '-' + mm + '-' + dd;
}

function checkOverflow(element) {
    // Create a clone of the element
    const clone = element.cloneNode(true);

    // Adjust styles
    const style = clone.style;
    style.position = 'absolute';
    style.top = '-9999px';
    style.left = '-9999px';
    style.width = 'auto';
    style.height = 'auto';
    style.overflow = 'visible';
    style.whiteSpace = 'nowrap';

    // Append to body and measure
    document.body.appendChild(clone);
    const isOverflowing = clone.scrollWidth > element.offsetWidth;

    // Remove the clone from the body
    document.body.removeChild(clone);

    return isOverflowing;
}

function ConditionalTooltipText({ text, style }) {
    const [isOverflowed, setIsOverflowed] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const element = textRef.current;
        if (element) {
            const element = textRef.current;
            if (element) {
                const isOverflowing = checkOverflow(element);
                setIsOverflowed(isOverflowing);
            }
        }
    }, [text]);

    const textComponent = (
        <div
            variant="body2"
            ref={textRef}
            style={style}
        >
            {text}
        </div>
    );

    return isOverflowed ? <Tooltip title={text} arrow placement="right-start">{textComponent}</Tooltip> : textComponent;
}


class Module extends React.Component {
    static contextType = IdTokenContext;

    constructor(props) {
        super(props);

        this.state = {
            module: props.module,
            editable: props.editable,
            onLoading: props.onLoading,
            onEnroll: props.onEnroll,
            onUnenroll: props.onUnenroll,
            onRemove: props.onRemove,
            openConfirmDialog: props.openConfirmDialog
        };

        this.onLoading = this.onLoading.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onEnroll = this.onEnroll.bind(this);
        this.onUnenroll = this.onUnenroll.bind(this);
    }

    onLoading(value) {
        if (this.state.onLoading !== undefined) {
            console.log('calling onLoading' + value);
            this.state.onLoading(value);
        }
    }

    onEnroll(moduleId) {
        this.state.openConfirmDialog({ description: `Do you really want to enroll to this module?` }, () => {
            this.onLoading(true);

            fetch(ENROLLMENT_URL + "?moduleId=" + moduleId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors',
                body: JSON.stringify({})
            })
                .then(response => response.json())
                .then(data => {
                    console.log('enrolled', data);

                    if (this.state.onEnroll !== undefined) {
                        this.state.onEnroll(moduleId, data['modules'][moduleId]);
                    }
                })
                .finally(() => this.onLoading(false));
        });
    }

    onUnenroll(moduleId) {
        this.state.openConfirmDialog({ description: `Do you really want to unenroll from this module?` }, () => {
            this.onLoading(true);

            fetch(ENROLLMENT_URL + "?moduleId=" + moduleId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('unenrolled', data);

                    if (this.state.onUnenroll !== undefined) {
                        this.state.onUnenroll(moduleId);
                    }
                })
                .finally(() => this.onLoading(false));
        });
    }

    onRemove(moduleId, title) {
        this.state.openConfirmDialog({ description: `Do you really want to delete module: "${title}"` }, () => {
            this.onLoading(true);

            fetch(MODULES_URL + "?moduleId=" + moduleId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.context.jwtToken },
                mode: 'cors'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('removed', data);

                    if (this.state.onRemove !== undefined) {
                        this.state.onRemove(moduleId, title);
                    }
                })
                .finally(() => this.onLoading(false));

        });
    }

    render() {
        const item = this.state.module;

        console.log('item', item);

        return (
            <>
                <Card sx={{ width: 300 }}>
                    <CardHeader sx={{ width: 300, display: 'block' }} title={
                        <RouteLink to={`/view-module/${item.id}`} style={{ textDecoration: 'none' }}>
                            <ConditionalTooltipText text={item.title} style={{
                                display: 'block',
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis"
                            }} /> </RouteLink>} subheader={item.enrollment && `Enrolled at: ${formatDate(new Date(parseInt(item.enrollment.date)))}` || 'New'} />
                    <CardContent sx={{ height: 155 }}>
                        <Stack direction="column" spacing={2} justifyContent="space-between">

                            {/*<Typography variant="h5" component="div">
                                <RouteLink to={`/view-module/${item.id}`} style={{ textDecoration: 'none' }}>
                                    <ConditionalTooltipText text={item.title} style={{
                                        display: 'block',
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis"
                                    }} />
                                </RouteLink>
                                </Typography>*/}

<ConditionalTooltipText text={item.summary} style={{
                                    overflow: 'hidden',
                                    lineHeight: '1.2',
                                    maxHeight: '2.4em',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis'
                                }} />

                            {/*<Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                <Grid container spacing={2}>
                                    {
                                        item.enrollment &&
                                        <Grid item xs={12} className="problem-right">
                                            <Stack direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                spacing={1}>
                                                <Chip icon={<SubscriptionsIcon />} label="enrolled" size="small" color="primary" />
                                            </Stack>
                                        </Grid>
                                    }
                                </Grid>
                                </Typography>*/}

                            <Stack direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={1}>
                                <>
                                    <DifficultyChip difficulty={item.difficulty} /></>
                                {
                                    item.enrollment && !this.state.module.finished && <>
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label={(Math.round((item.solved.length / item.problems.length) * 100) || 0) + '%'}
                                            size="small"
                                            color="primary" />
                                    </>
                                }

                                {this.state.module.finished && <Chip icon={<TaskAltIcon />} size="small" label="finished" color="success" />}
                            </Stack>
                        </Stack>
                    </CardContent>
                    <CardActions>

                        {!item.enrollment &&
                            <Button size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => this.onEnroll(item.id)}>Enroll</Button>}
                        {item.enrollment &&
                            <Button size="small"
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={() => this.onUnenroll(item.id)}>Unenroll</Button>}
                        {this.state.editable &&
                            <>
                                <RouteLink to={`/edit-module/${item.id}`} style={{ textDecoration: 'none' }}>
                                    <IconButton disabled={this.state.loading} color="primary"><ModeEditIcon /></IconButton>
                                </RouteLink>
                                <RouteLink to={`/copy-module/${item.id}`} style={{ textDecoration: 'none' }}>
                                    <IconButton disabled={this.state.loading} color="primary"><ContentCopyIcon /></IconButton>
                                </RouteLink>
                                <IconButton disabled={this.state.loading} color="primary" onClick={() => this.onRemove(item.id, item.title)}><DeleteIcon /></IconButton>
                            </>
                        }
                    </CardActions>
                </Card >
            </>
        );
    }
}

export default Module;