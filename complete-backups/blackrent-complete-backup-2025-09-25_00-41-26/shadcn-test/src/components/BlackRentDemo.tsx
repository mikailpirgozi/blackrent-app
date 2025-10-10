import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Mock data pre BlackRent
const mockVehicles = [
  { id: 1, name: 'BMW X5', type: 'SUV', status: 'available', price: '120€/deň' },
  { id: 2, name: 'Audi A4', type: 'Sedan', status: 'rented', price: '80€/deň' },
  { id: 3, name: 'Mercedes E-Class', type: 'Sedan', status: 'maintenance', price: '100€/deň' },
];

const mockRentals = [
  { id: 1, customer: 'Ján Novák', vehicle: 'BMW X5', startDate: '2024-01-15', endDate: '2024-01-20', status: 'active' },
  { id: 2, customer: 'Peter Kováč', vehicle: 'Audi A4', startDate: '2024-01-10', endDate: '2024-01-15', status: 'completed' },
  { id: 3, customer: 'Anna Svobodová', vehicle: 'Mercedes E-Class', startDate: '2024-01-25', endDate: '2024-01-30', status: 'pending' },
];

export const BlackRentDemo: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [progressValue, setProgressValue] = useState(33);
  const [sliderValue, setSliderValue] = useState([50]);
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Dostupné</Badge>;
      case 'rented':
        return <Badge variant="destructive">Prenajaté</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Údržba</Badge>;
      case 'active':
        return <Badge variant="default">Aktívne</Badge>;
      case 'completed':
        return <Badge variant="secondary">Dokončené</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Čakajúce</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">BlackRent Demo</h1>
        <p className="text-muted-foreground text-lg">Modrá téma s shadcn/ui komponentmi</p>
      </div>

      {/* Header s akciami */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Prehľad vozidiel a rezervácií</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nová rezervácia
          </Button>
        </div>
      </div>

      {/* Štatistiky karty - shadcn/ui štýl */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              +0% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,400</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vozidlá sekcia */}
      <Card>
        <CardHeader>
          <CardTitle>Vozidlá</CardTitle>
          <CardDescription>
            Zoznam všetkých vozidiel v BlackRent flotile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Názov</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.name}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>{vehicle.price}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Upraviť
                      </Button>
                      <Button variant="outline" size="sm">
                        Detaily
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rezervácie sekcia */}
      <Card>
        <CardHeader>
          <CardTitle>Rezervácie</CardTitle>
          <CardDescription>
            Aktívne a nedávne rezervácie vozidiel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zákazník</TableHead>
                <TableHead>Vozidlo</TableHead>
                <TableHead>Začiatok</TableHead>
                <TableHead>Koniec</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {rental.customer.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {rental.customer}
                    </div>
                  </TableCell>
                  <TableCell>{rental.vehicle}</TableCell>
                  <TableCell>{rental.startDate}</TableCell>
                  <TableCell>{rental.endDate}</TableCell>
                  <TableCell>{getStatusBadge(rental.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Zobraziť
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal pre novú rezerváciu */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nová rezervácia</DialogTitle>
            <DialogDescription>
              Vyplňte údaje pre novú rezerváciu vozidla.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Zákazník
              </Label>
              <Input
                id="customer"
                placeholder="Meno zákazníka"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle" className="text-right">
                Vozidlo
              </Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Vyberte vozidlo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bmw">BMW X5</SelectItem>
                  <SelectItem value="audi">Audi A4</SelectItem>
                  <SelectItem value="mercedes">Mercedes E-Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Začiatok
              </Label>
              <Input
                id="startDate"
                type="date"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Koniec
              </Label>
              <Input
                id="endDate"
                type="date"
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              Vytvoriť rezerváciu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar s filtrami */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Filtre</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtre</SheetTitle>
            <SheetDescription>
              Nastavte filtre pre zobrazenie vozidiel a rezervácií.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Všetky statusy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky</SelectItem>
                  <SelectItem value="available">Dostupné</SelectItem>
                  <SelectItem value="rented">Prenajaté</SelectItem>
                  <SelectItem value="maintenance">Údržba</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-filter">Typ vozidla</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Všetky typy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-range">Cenový rozsah</Label>
              <div className="flex gap-2">
                <Input placeholder="Min" />
                <Input placeholder="Max" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Resetovať
            </Button>
            <Button className="flex-1">
              Aplikovať
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Nové komponenty sekcia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kalendár sekcia */}
        <Card>
          <CardHeader>
            <CardTitle>Kalendár rezervácií</CardTitle>
            <CardDescription>
              Zobrazenie dostupnosti vozidiel v kalendári
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label>Vyberte dátum:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {selectedDate ? selectedDate.toLocaleDateString('sk-SK') : "Vyberte dátum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-green-600">Dostupné</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-sm text-red-600">Prenajaté</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pokročilé komponenty */}
        <Card>
          <CardHeader>
            <CardTitle>Pokročilé komponenty</CardTitle>
            <CardDescription>
              Ukážka ďalších shadcn/ui komponentov
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <Label>Progress: {progressValue}%</Label>
              <Progress value={progressValue} className="w-full" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
              >
                Zvýšiť
              </Button>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <Label>Slider: {sliderValue[0]}€</Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            {/* Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={isSwitchOn}
                onCheckedChange={setIsSwitchOn}
              />
              <Label htmlFor="notifications">Povoliť notifikácie</Label>
            </div>

            {/* Checkbox */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Súhlasím s podmienkami</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="newsletter" />
                <Label htmlFor="newsletter">Chcem dostávať newsletter</Label>
              </div>
            </div>

            {/* Radio Group */}
            <div className="space-y-2">
              <Label>Typ platby:</Label>
              <RadioGroup defaultValue="card">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Kartou</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Hotovosť</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer">Prevod</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                placeholder="Zadajte poznámky k rezervácii..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs sekcia */}
      <Card>
        <CardHeader>
          <CardTitle>Tabuľky a organizácia</CardTitle>
          <CardDescription>
            Organizácia obsahu pomocou tabs a accordion komponentov
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Prehľad</TabsTrigger>
              <TabsTrigger value="vehicles">Vozidlá</TabsTrigger>
              <TabsTrigger value="rentals">Rezervácie</TabsTrigger>
              <TabsTrigger value="settings">Nastavenia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Celkové vozidlá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">+1 tento mesiac</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Aktívne rezervácie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1</div>
                    <p className="text-xs text-muted-foreground">+0% tento týždeň</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Príjem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€2,400</div>
                    <p className="text-xs text-muted-foreground">+12% tento mesiac</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles">
              <div className="text-center py-8 text-muted-foreground">
                Tabuľka vozidiel by tu bola...
              </div>
            </TabsContent>
            
            <TabsContent value="rentals">
              <div className="text-center py-8 text-muted-foreground">
                Tabuľka rezervácií by tu bola...
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Nastavenia účtu</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="email-notifications" />
                        <Label htmlFor="email-notifications">Email notifikácie</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="sms-notifications" />
                        <Label htmlFor="sms-notifications">SMS notifikácie</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Bezpečnosť</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Button variant="outline">Zmeniť heslo</Button>
                      <Button variant="outline">Dvojfaktorová autentifikácia</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Vzhľad</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Label>Téma:</Label>
                      <RadioGroup defaultValue="light">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="light" id="light" />
                          <Label htmlFor="light">Svetlá</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="dark" id="dark" />
                          <Label htmlFor="dark">Tmavá</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlackRentDemo;
