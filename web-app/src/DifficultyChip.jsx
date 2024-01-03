import React from 'react';
import Chip from '@mui/material/Chip';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SpaIcon from '@mui/icons-material/Spa';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';

function DifficultyChip({ difficulty }) {

    return (
        <>
            {
                difficulty === 'easy' ?
                    <Chip size="small" label={difficulty} icon={<SpaIcon />} color="success" variant="outlined" /> :
                    difficulty === 'medium' ?
                        <Chip size="small" label={difficulty} icon={<PsychologyAltIcon />} color="warning" variant="outlined" /> :
                        <Chip size="small" label={difficulty} icon={<WhatshotIcon />} color="error" variant="outlined" />
            }
        </>
    );
}

export default DifficultyChip;