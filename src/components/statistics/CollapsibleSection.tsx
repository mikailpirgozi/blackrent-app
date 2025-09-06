/**
 * 📂 COLLAPSIBLE SECTION
 *
 * Expandable section pre mobile statistics s smooth animations
 */

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { memo, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  color?:
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'secondary'
    | string;
  compact?: boolean;
  disabled?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultExpanded = false,
  children,
  color = 'primary',
  compact = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (!disabled) {
      setExpanded(prev => !prev);
    }
  };

  // Get color based on theme
  const getColor = (colorName: string) => {
    const colors: Record<string, string> = {
      primary: theme.palette.primary.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
    };
    return colors[colorName] || colorName;
  };

  const sectionColor = getColor(color);

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: compact ? 2 : 3,
        overflow: 'hidden',
        border: `1px solid ${sectionColor}20`,
        backgroundColor: expanded
          ? `${sectionColor}05`
          : theme.palette.background.paper,
        transition: 'all 0.3s ease-in-out',
        '&:hover': !disabled
          ? {
              borderColor: `${sectionColor}40`,
              backgroundColor: `${sectionColor}08`,
            }
          : {},
        ...(disabled && {
          opacity: 0.6,
          cursor: 'not-allowed',
        }),
      }}
    >
      {/* Header */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: compact ? 2 : 2.5,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': !disabled
            ? {
                backgroundColor: `${sectionColor}08`,
              }
            : {},
          borderBottom: expanded ? `1px solid ${sectionColor}15` : 'none',
        }}
      >
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 1.5,
              color: sectionColor,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {icon}
          </Box>
        )}

        {/* Title and Subtitle */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant={compact ? 'subtitle2' : 'h6'}
              sx={{
                fontWeight: 600,
                color: expanded ? sectionColor : 'text.primary',
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {title}
            </Typography>

            {/* Badge */}
            {badge !== undefined && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  backgroundColor: `${sectionColor}15`,
                  color: sectionColor,
                  fontSize: '0.7rem',
                  height: 20,
                  minWidth: 20,
                }}
              />
            )}
          </Box>

          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Expand Icon */}
        <IconButton
          size="small"
          disabled={disabled}
          sx={{
            color: expanded ? sectionColor : 'text.secondary',
            transition: 'all 0.3s ease-in-out',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            '&:hover': !disabled
              ? {
                  backgroundColor: `${sectionColor}15`,
                }
              : {},
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse
        in={expanded}
        timeout={{
          enter: 300,
          exit: 200,
        }}
        unmountOnExit
      >
        <Box
          sx={{
            p: compact ? 2 : 2.5,
            pt: compact ? 1.5 : 2,
            backgroundColor: expanded ? `${sectionColor}02` : 'transparent',
            transition: 'background-color 0.2s ease-in-out',
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default memo(CollapsibleSection);
