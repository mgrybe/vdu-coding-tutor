import React, { useRef } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import TagIcon from '@mui/icons-material/Tag';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

// https://blog.theashishmaurya.me/how-to-create-a-tag-input-feature-in-reactjs-and-material-ui

function Tags({ data, handleDelete }) {
    return (
        <Chip icon={<TagIcon />} label={data} style={{ textTransform: 'lowercase' }} onDelete={() => handleDelete(data)} />
    );
}

export default function TagsField({ value = [], onChange = () => {} }) {

    const tagRef = useRef();

    const handleOnEnter = (e) => {
        e.preventDefault();
        const newTags = [...value, tagRef.current.value];
        onChange(newTags);  // Call the onChange callback with the new tags array
        tagRef.current.value = "";
    };

    const handleDelete = (tagToDelete) => {
        const newTags = value.filter(tag => tag !== tagToDelete);
        onChange(newTags);  // Call the onChange callback with the new tags array
    };

    return (
        <>
            <TextField
                inputRef={tagRef}
                fullWidth
                margin='none'
                placeholder="Enter tags here"
                onKeyDown={(event) => event.key === 'Enter' ? handleOnEnter(event) : null}
                InputProps={{
                    startAdornment: (
                        <Box sx={{ margin: "0 0.2rem 0 0", display: "flex" }}>
                            <Stack direction='row' gap={1}>
                                {value.map((tag, index) => (
                                    <Tags data={tag} handleDelete={handleDelete} key={index} />
                                ))}
                            </Stack>
                        </Box>
                    ),
                }}
            />
        </>
    );
};