import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPage } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';
import { Box, Button, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const Pagination: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { pagination } = useSelector((state: RootState) => state.tasks);
    const { page, totalPages } = pagination;

    if (totalPages <= 1) return null;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            dispatch(setPage(newPage));
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === page ? "contained" : "outlined"}
                    onClick={() => handlePageChange(i)}
                    size="small"
                    sx={{
                        minWidth: '40px',
                        margin: '0 2px',
                        fontWeight: i === page ? 'bold' : 'normal'
                    }}
                >
                    {i}
                </Button>
            );
        }

        return pages;
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 4,
            mb: 2
        }}>
            <Button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                startIcon={<ChevronLeft />}
                variant="outlined"
                size="small"
            >
                Назад
            </Button>

            <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                {renderPageNumbers()}
            </Box>

            <Button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                endIcon={<ChevronRight />}
                variant="outlined"
                size="small"
            >
                Вперед
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Страница {page} из {totalPages}
            </Typography>
        </Box>
    );
};

export default Pagination;