//
// Copyright 2022 DXOS.org
//

import React, { useState } from 'react';

import { Add as AddIcon } from '@mui/icons-material';
import { Box, Fab } from '@mui/material';

import { CreateItemDialog, TestType } from '../../../src';
import { itemAdapter } from '../testing';
import { TypeSelector } from './TypeSelector';

interface CreateItemButtonProps {
  onCreate: (type: string, title: string) => void
}

export const CreateItemButton = ({
  onCreate
}: CreateItemButtonProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>(TestType.Org);

  const handleCreate = (title: string) => {
    setOpen(false);
    onCreate(type, title);
  };

  return (
    <>
      <CreateItemDialog
        open={open}
        itemAdapter={itemAdapter}
        onCreate={(title: string) => handleCreate(title)}
        onCancel={() => setOpen(false)}
      >
        <Box sx={{ marginBottom: 1 }}>
          <TypeSelector
            value={type}
            onChange={(type: string) => setType(type)}
          />
        </Box>
      </CreateItemDialog>

      <Fab
        onClick={() => setOpen(true)}
        size='small'
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
};
