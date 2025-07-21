    });
    setSearchQuery('');
  };

  // Enhanced filtering logic
  const filteredRentals = useMemo(() => {
    let filtered = rentals;

    // Basic search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(query) ||
        rental.vehicle?.brand?.toLowerCase().includes(query) ||
        rental.vehicle?.model?.toLowerCase().includes(query) ||
        rental.vehicle?.licensePlate?.toLowerCase().includes(query) ||
        rental.vehicle?.company?.toLowerCase().includes(query)
      );
    }

    // Advanced filters
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) >= new Date(advancedFilters.dateFrom)
      );
    }

    if (advancedFilters.dateTo) {
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) <= new Date(advancedFilters.dateTo)
      );
    }

    if (advancedFilters.vehicleBrand) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.brand?.toLowerCase().includes(advancedFilters.vehicleBrand.toLowerCase())
      );
    }

    if (advancedFilters.vehicleModel) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.model?.toLowerCase().includes(advancedFilters.vehicleModel.toLowerCase())
      );
    }

    if (advancedFilters.licensePlate) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.licensePlate?.toLowerCase().includes(advancedFilters.licensePlate.toLowerCase())
      );
    }

    if (advancedFilters.company) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.company === advancedFilters.company
      );
    }

    if (advancedFilters.customerName) {
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(advancedFilters.customerName.toLowerCase())
      );
    }

    if (advancedFilters.priceFrom) {
      filtered = filtered.filter(rental => 
        (rental.totalPrice || 0) >= parseFloat(advancedFilters.priceFrom)
      );
    }

    if (advancedFilters.priceTo) {
      filtered = filtered.filter(rental => 
        (rental.totalPrice || 0) <= parseFloat(advancedFilters.priceTo)
      );
    }

    if (advancedFilters.paymentMethod) {
      filtered = filtered.filter(rental => 
        rental.paymentMethod === advancedFilters.paymentMethod
      );
    }

    if (advancedFilters.paymentStatus) {
      filtered = filtered.filter(rental => {
        if (advancedFilters.paymentStatus === 'paid') return rental.paid === true;
        if (advancedFilters.paymentStatus === 'unpaid') return rental.paid === false;
        return true;
      });
    }

    if (advancedFilters.hasHandoverProtocol) {
      filtered = filtered.filter(rental => 
        !!protocols[rental.id]?.handover
      );
    }

    if (advancedFilters.hasReturnProtocol) {
      filtered = filtered.filter(rental => 
        !!protocols[rental.id]?.return
      );
    }

    if (advancedFilters.rentalStatus) {
      const now = new Date();
      filtered = filtered.filter(rental => {
        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        
        switch (advancedFilters.rentalStatus) {
          case 'active':
            return now >= startDate && now <= endDate;
          case 'completed':
            return now > endDate;
          case 'future':
import React, { useState, useCallback, useMemo, useEffect } from 'react';
            return now < startDate;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [rentals, searchQuery, advancedFilters, protocols]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Prenájmy</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ 
            minWidth: isMobile ? 'auto' : 'auto',
            px: isMobile ? 2 : 3
          }}
        >
          {isMobile ? 'Pridať' : 'Nový prenájom'}
        </Button>
      </Box>

      {/* Moderné vyhľadávanie a filtre */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          {/* Search Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 250 }}>
            <TextField
              placeholder="Hľadať prenájmy..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'background.default',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: 'text.secondary' }}>
                    <SearchIcon fontSize="small" />
                  </Box>
                )
              }}
            />
          </Box>
          
          {/* Filter Button */}
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Filtre
          </Button>
          
          {/* Reset Button */}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setSearchQuery('')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Reset
          </Button>
        </Box>
        
        {/* Search results info */}
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Zobrazených: {filteredRentals.length} z {rentals.length} prenájmov
          </Typography>
        )}
      </Box>

      {/* Workflow Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Workflow protokolov:</strong> Najprv vytvorte protokol prevzatia vozidla (🔄), potom protokol vrátenia (↩️). Kliknite "Zobraziť protokoly" pre zobrazenie existujúcich protokolov.
        </Typography>
      </Alert>

      <ResponsiveTable
        columns={columns}
        data={filteredRentals}
        selectable={true}
        selected={selected}
        onSelectionChange={setSelected}
        emptyMessage="Žiadne prenájmy"
      />

      {/* Rental Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
        </DialogTitle>
        <DialogContent>
          <RentalForm
            rental={editingRental}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Handover Protocol Dialog */}
      <Dialog
        open={openHandoverDialog}
        onClose={() => setOpenHandoverDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol prevzatia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <HandoverProtocolForm
              open={openHandoverDialog}
              rental={selectedRentalForProtocol}
              onSave={handleSaveHandover}
              onClose={() => setOpenHandoverDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol vrátenia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <ReturnProtocolForm
              open={openReturnDialog}
              onClose={() => setOpenReturnDialog(false)}
              rental={selectedRentalForProtocol}
              handoverProtocol={protocols[selectedRentalForProtocol.id]?.handover}
              onSave={handleSaveReturn}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          open={pdfViewerOpen}
          onClose={handleClosePDF}
          protocolId={selectedPdf.url}
          protocolType={selectedPdf.type}
          title={selectedPdf.title}
        />
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        open={galleryOpen}
        onClose={handleCloseGallery}
        images={selectedProtocolImages}
        videos={selectedProtocolVideos}
        title={galleryTitle}
      />
    </Box>
  );
} 