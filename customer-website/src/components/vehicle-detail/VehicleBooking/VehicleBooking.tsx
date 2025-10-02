'use client';

import React, { useState } from 'react';

interface VehicleBookingProps {
  vehicleId: string;
  pricePerDay: number;
  className?: string;
}

export const VehicleBooking: React.FC<VehicleBookingProps> = ({
  vehicleId,
  pricePerDay,
  className = ''
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);

  const calculateDays = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalDays(diffDays);
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    calculateDays(date, endDate);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    calculateDays(startDate, date);
  };

  const totalPrice = totalDays * pricePerDay;

  return (
    <div className={`relative ${className}`}>
      {/* Mobile Booking */}
      <div className="block md:hidden">
        <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[1400px] left-4 p-6 bg-[#0A0A0F] rounded-2xl border border-[#1A1A1F]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-xl tracking-[0] leading-7">
              Rezervácia
            </div>
            
            <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum začiatku
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum ukončenia
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] p-4 bg-[#0F0F14] rounded-lg">
                <div className="flex flex-col items-start gap-1">
                  <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                    {totalDays} {totalDays === 1 ? 'deň' : totalDays < 5 ? 'dni' : 'dní'}
                  </div>
                  <div className="font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-lg tracking-[0] leading-6">
                    {totalPrice}€
                  </div>
                </div>
                <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                  {pricePerDay}€/deň
                </div>
              </div>
            )}

            <button className="flex items-center justify-center gap-2 px-6 py-3 relative self-stretch w-full flex-[0_0_auto] bg-[#F0FF98] rounded-lg">
              <div className="relative w-fit font-['Poppins',Helvetica] font-semibold text-[#05050A] text-base tracking-[0] leading-6 whitespace-nowrap">
                Rezervovať teraz
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tablet Booking */}
      <div className="hidden md:block lg:hidden">
        <div className="flex flex-col w-[680px] items-start gap-6 absolute top-[1600px] left-8 p-8 bg-[#0A0A0F] rounded-2xl border border-[#1A1A1F]">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
              Rezervácia
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative self-stretch w-full">
              <div className="flex flex-col items-start gap-2">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum začiatku
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>

              <div className="flex flex-col items-start gap-2">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum ukončenia
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] p-6 bg-[#0F0F14] rounded-lg">
                <div className="flex flex-col items-start gap-1">
                  <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-base tracking-[0] leading-6">
                    {totalDays} {totalDays === 1 ? 'deň' : totalDays < 5 ? 'dni' : 'dní'}
                  </div>
                  <div className="font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
                    {totalPrice}€
                  </div>
                </div>
                <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-base tracking-[0] leading-6">
                  {pricePerDay}€/deň
                </div>
              </div>
            )}

            <button className="flex items-center justify-center gap-2 px-8 py-4 relative self-stretch w-full flex-[0_0_auto] bg-[#F0FF98] rounded-lg">
              <div className="relative w-fit font-['Poppins',Helvetica] font-semibold text-[#05050A] text-lg tracking-[0] leading-7 whitespace-nowrap">
                Rezervovať teraz
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Booking */}
      <div className="hidden lg:block">
        <div className="flex flex-col w-[400px] items-start gap-6 absolute top-[1000px] right-44 p-8 bg-[#0A0A0F] rounded-2xl border border-[#1A1A1F]">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
              Rezervácia
            </div>
            
            <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum začiatku
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full">
                <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                  Dátum ukončenia
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full p-3 bg-[#151520] border border-[#25252A] rounded-lg text-[#F0F0F5] font-['Poppins',Helvetica] text-sm"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] p-6 bg-[#0F0F14] rounded-lg">
                <div className="flex flex-col items-start gap-1">
                  <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-base tracking-[0] leading-6">
                    {totalDays} {totalDays === 1 ? 'deň' : totalDays < 5 ? 'dni' : 'dní'}
                  </div>
                  <div className="font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
                    {totalPrice}€
                  </div>
                </div>
                <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-base tracking-[0] leading-6">
                  {pricePerDay}€/deň
                </div>
              </div>
            )}

            <button className="flex items-center justify-center gap-2 px-8 py-4 relative self-stretch w-full flex-[0_0_auto] bg-[#F0FF98] rounded-lg">
              <div className="relative w-fit font-['Poppins',Helvetica] font-semibold text-[#05050A] text-lg tracking-[0] leading-7 whitespace-nowrap">
                Rezervovať teraz
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
