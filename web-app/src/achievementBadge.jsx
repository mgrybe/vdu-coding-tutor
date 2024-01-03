import React from 'react';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';

const Achievement = ({ text, earned }) => {
    return (
        <>
            <Card sx={{ width: 300 }}>
                <CardHeader sx={{ width: 300, display: 'block' }} />
                <CardContent>
                    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
                        <div className='svg-container' style={{ opacity: earned ? 1 : 0.7 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" x="10" y="10" selection="true">
                                <path fill="#3275e7" d="M200,0c-41.3,0-82.6,3.4-123.4,10.3C76.6,46.6,47.2,76,10.9,76v52v144v50.9c18.1,0,34.6,7.4,46.5,19.3
	s19.3,28.3,19.3,46.5c40.8,7.6,82.1,11.5,123.4,11.5s82.6-3.8,123.4-11.5c0-36.3,29.4-65.7,65.7-65.7v-51V128V76
	c-18.1,0-34.6-7.3-46.5-19.3c-11.9-11.9-19.3-28.3-19.3-46.5C282.6,3.4,241.3,0,200,0L200,0z" fill-id="0"></path>
                                <path fill="#b8e5f3" d="M305.4,27.4c-34.9-5.1-70.3-7.7-105.4-7.7s-70.5,2.6-105.5,7.7c-6.6,32.5-31.8,58.4-64,66V128v144v33.4
	c15.3,3.6,29.3,11.4,40.7,22.8c12.1,12.1,20.1,27.1,23.4,43.5c34.8,5.7,70.2,8.6,105.4,8.6s70.5-2.9,105.4-8.6
	c6.6-32.6,31.8-58.6,64-66.3V272V128V93.4c-15.3-3.6-29.3-11.4-40.7-22.8C316.7,58.7,308.7,43.7,305.4,27.4z" fill-id="1"></path>
                                <path fill="#78aef9" d="M30.6,126.1v2v142.4c112.8-8.7,226.1-8.7,338.9,0V128v-2C256.7,115.3,143.3,115.3,30.6,126.1z" fill-id="2"></path>
                                <foreignObject width="380" height="96" style={{ fontSize: '30px', color: 'rgb(255, 255, 255)', fontFamily: 'Arial', fontWeight: 400, textAlign: 'center', letterSpacing: '0em', lineHeight: 1.5 }} x="10" y="150" shrink-to-fit="width" vertical-align="middle" selection="true">
                                    <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: '35px', paddingTop: '0' }}>{text}</div>
                                </foreignObject>
                            </svg>
                        </div>
                    </Stack>
                </CardContent>
                <CardActions></CardActions>
            </Card >
        </>
    );
}

export default Achievement;