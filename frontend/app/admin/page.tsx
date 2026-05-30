'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PriceInput } from '@/components/admin/PriceInput'
import { DateTimePicker } from '@/components/admin/DateTimePicker'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ImageManager, type ServiceImage } from '@/components/admin/ImageManager'
import { SiteContentEditor } from '@/components/admin/SiteContentEditor'
import { PricingSettingsEditor } from '@/components/admin/PricingSettingsEditor'
import { BrandingEditor } from '@/components/admin/BrandingEditor'
import { SecurityBanner } from '@/components/admin/SecurityBanner'
import {
  House,
  CalendarDays,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  CircleCheck,
  CircleX,
  Hourglass,
  User,
  Mail,
  Loader2,
  Layout,
  Receipt,
  Palette,
} from 'lucide-react'

type Service = {
  id: number
  name: string
  description: string | null
  duration: number
  price: number
  deposit_pct: number | null
  images?: ServiceImage[]
}
type Slot = {
  id: number
  serviceId: number
  start: string
  end: string
  capacity: number
  service: { name: string }
  bookings?: any[]
}
type Booking = {
  id: number
  customerName: string
  customerEmail: string
  status: string
  service: { name: string }
  slot: any
  createdAt: string
}

type ConfirmState =
  | { open: false }
  | {
      open: true
      title: string
      description: string
      destructive: boolean
      onConfirm: () => Promise<void>
    }

export default function AdminPage() {
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  // Service form
  const [svcName, setSvcName] = useState('')
  const [svcDescription, setSvcDescription] = useState('')
  const [svcDuration, setSvcDuration] = useState('2')
  const [svcPrice, setSvcPrice] = useState(40000)
  const [svcDepositPct, setSvcDepositPct] = useState('30')
  const [editingSvcId, setEditingSvcId] = useState<number | null>(null)
  const [editingImages, setEditingImages] = useState<ServiceImage[]>([])
  const [savingService, setSavingService] = useState(false)

  // Slot form
  const [slotServiceId, setSlotServiceId] = useState<string>('')
  const [slotStart, setSlotStart] = useState('')
  const [slotEnd, setSlotEnd] = useState('')
  const [savingSlot, setSavingSlot] = useState(false)

  // Confirm modal
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false })

  useEffect(() => {
    Promise.all([loadServices(), loadSlots(), loadBookings()]).catch(() => {
      toast.error('Failed to load data', {
        description: 'Check your backend connection and try again.',
      })
    })
  }, [])

  async function loadServices() {
    const res = await fetch('/api/admin/services')
    setServices(await res.json())
  }
  async function loadSlots() {
    const res = await fetch('/api/admin/slots')
    setSlots(await res.json())
  }
  async function loadBookings() {
    const res = await fetch('/api/admin/bookings')
    setBookings(await res.json())
  }

  async function saveService() {
    if (!svcName.trim()) {
      toast.error('Name is required')
      return
    }
    if (svcPrice <= 0) {
      toast.error('Price must be greater than zero')
      return
    }
    setSavingService(true)
    try {
      const body = {
        id: editingSvcId,
        name: svcName,
        description: svcDescription.trim() || null,
        duration: svcDuration,
        price: String(svcPrice),
        deposit_pct: svcDepositPct || '30',
      }
      const res = await fetch('/api/admin/services', {
        method: editingSvcId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(editingSvcId ? 'Homestay updated' : 'Homestay added')
      resetServiceForm()
      await loadServices()
    } catch {
      toast.error('Could not save homestay', {
        description: 'Please try again or check the backend.',
      })
    } finally {
      setSavingService(false)
    }
  }

  function editService(s: Service) {
    setEditingSvcId(s.id)
    setSvcName(s.name)
    setSvcDescription(s.description ?? '')
    setSvcDuration(String(s.duration))
    setSvcPrice(s.price)
    setSvcDepositPct(String(s.deposit_pct ?? 30))
    setEditingImages(s.images ?? [])
  }

  function resetServiceForm() {
    setEditingSvcId(null)
    setSvcName('')
    setSvcDescription('')
    setSvcDuration('2')
    setSvcPrice(40000)
    setSvcDepositPct('30')
    setEditingImages([])
  }

  function handleImagesChange(images: ServiceImage[]) {
    setEditingImages(images)
    // Keep the services list in sync so the public site reflects changes
    setServices((prev) =>
      prev.map((s) => (s.id === editingSvcId ? { ...s, images } : s)),
    )
  }

  function askDeleteService(s: Service) {
    setConfirm({
      open: true,
      title: `Delete "${s.name}"?`,
      description:
        'This homestay and all related slots will be permanently removed. Existing bookings may be affected.',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/services?id=${s.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          toast.error('Could not delete homestay')
          return
        }
        toast.success('Homestay deleted')
        await loadServices()
      },
    })
  }

  async function addSlot() {
    if (!slotServiceId) {
      toast.error('Pick a homestay first')
      return
    }
    if (!slotStart || !slotEnd) {
      toast.error('Both check-in and check-out are required')
      return
    }
    if (new Date(slotEnd) <= new Date(slotStart)) {
      toast.error('Check-out must be after check-in')
      return
    }
    setSavingSlot(true)
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: Number(slotServiceId),
          start: slotStart,
          end: slotEnd,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Slot create failed')
      toast.success('Slot added')
      setSlotServiceId('')
      setSlotStart('')
      setSlotEnd('')
      await loadSlots()
    } catch {
      toast.error('Could not add slot')
    } finally {
      setSavingSlot(false)
    }
  }

  function askDeleteSlot(sl: Slot) {
    const hasBookings = (sl.bookings?.length ?? 0) > 0
    setConfirm({
      open: true,
      title: hasBookings ? 'Remove this guest booking range?' : 'Remove this blocked range?',
      description: hasBookings
        ? `This range backs ${(sl.bookings?.length ?? 0)} guest booking(s). Removing it will free up the dates and leave the booking(s) without a date — cancel the booking from the Bookings tab instead.`
        : 'These dates will become available for guests to book again.',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/slots?id=${sl.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          toast.error('Could not remove range')
          return
        }
        toast.success(hasBookings ? 'Range removed' : 'Dates unblocked')
        await loadSlots()
      },
    })
  }

  function askCancelBooking(b: Booking) {
    setConfirm({
      open: true,
      title: `Cancel booking for ${b.customerName}?`,
      description:
        'The booking will be marked cancelled, the calendar event removed, and a refund processed if payment was taken.',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch('/api/admin/cancel', {
          method: 'POST',
          body: JSON.stringify({ bookingId: b.id }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) {
          toast.error('Could not cancel booking')
          return
        }
        toast.success('Booking cancelled')
        await loadBookings()
      },
    })
  }

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length

  return (
    <div className="container py-10 lg:py-12 space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Admin
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Home Anywhere dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Manage your homestays, check-in slots, and guest bookings.
        </p>
      </header>

      <SecurityBanner />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={House} label="Homestays" value={services.length} />
        <StatCard
          icon={CalendarDays}
          label="Blocked ranges"
          value={slots.length}
        />
        <StatCard
          icon={ClipboardList}
          label="Total bookings"
          value={bookings.length}
        />
        <StatCard
          icon={CircleCheck}
          label="Confirmed"
          value={confirmedCount}
          accent
        />
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="bg-muted p-1 h-auto">
          <TabsTrigger
            value="services"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <House className="h-4 w-4 mr-2" />
            Homestays
          </TabsTrigger>
          <TabsTrigger
            value="slots"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Blocked dates
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Bookings
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Layout className="h-4 w-4 mr-2" />
            Site content
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* SERVICES */}
        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    {editingSvcId ? (
                      <>
                        <Pencil className="h-4 w-4 text-primary" />
                        Edit homestay
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 text-primary" />
                        Add new homestay
                      </>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the details that guests will see on the platform.
                  </p>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveService()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="svc-name">Name</Label>
                    <Input
                      id="svc-name"
                      placeholder="Langkawi Seaview Villa"
                      value={svcName}
                      onChange={(e) => setSvcName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-description">
                      Description{' '}
                      <span className="text-muted-foreground font-normal">
                        — optional
                      </span>
                    </Label>
                    <Textarea
                      id="svc-description"
                      rows={3}
                      placeholder="3-bedroom oceanfront villa with private pool, BBQ pit, and walking distance to Pantai Cenang…"
                      value={svcDescription}
                      onChange={(e) => setSvcDescription(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown to guests on the homepage and booking page. Keep it
                      short — about 1-2 sentences.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-duration">Minimum nights</Label>
                    <Input
                      id="svc-duration"
                      type="number"
                      min={1}
                      value={svcDuration}
                      onChange={(e) => setSvcDuration(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Guests must book at least this many nights for this stay.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-price">Price per night</Label>
                    <PriceInput
                      id="svc-price"
                      value={svcPrice}
                      onValueChange={setSvcPrice}
                      placeholder="400.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Charged per night. Total = this × number of nights guest
                      books.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-deposit-pct">Deposit %</Label>
                    <div className="relative">
                      <Input
                        id="svc-deposit-pct"
                        type="number"
                        min={0}
                        max={100}
                        value={svcDepositPct}
                        onChange={(e) => setSvcDepositPct(e.target.value)}
                        className="pr-9 font-medium"
                        placeholder="30"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Percentage of the booking total charged upfront. Balance
                      paid on check-in. Defaults to 30%.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={savingService}
                    >
                      {savingService ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingSvcId ? (
                        <>
                          <Check className="h-4 w-4" />
                          Save changes
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add homestay
                        </>
                      )}
                    </Button>
                    {editingSvcId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetServiceForm}
                        disabled={savingService}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>

                {editingSvcId && (
                  <div className="pt-6 border-t border-border space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm">Photos</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upload photos that guests will see on listing cards.
                      </p>
                    </div>
                    <ImageManager
                      serviceId={editingSvcId}
                      images={editingImages}
                      onChange={handleImagesChange}
                    />
                  </div>
                )}

                {!editingSvcId && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-4">
                    💡 Save the homestay first, then click <em>Edit</em> on the
                    list to upload photos.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <House className="h-4 w-4 text-primary" />
                    Current homestays
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {services.length} listing
                    {services.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Min nights</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.length ? (
                        services.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {s.duration}
                            </TableCell>
                            <TableCell className="font-medium">
                              RM {(s.price / 100).toLocaleString()}
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                / night
                              </span>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editService(s)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => askDeleteService(s)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No homestays yet. Add your first one!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLOTS */}
        <TabsContent value="slots" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Block a date range
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mark a range as unavailable — guests won&apos;t be able to
                    book overlapping dates. Useful for maintenance, owner
                    stays, or external bookings.
                  </p>
                </div>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    addSlot()
                  }}
                >
                  <div className="space-y-2">
                    <Label>Homestay</Label>
                    <Select
                      value={slotServiceId}
                      onValueChange={setSlotServiceId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a homestay" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slot-start">Block from</Label>
                    <DateTimePicker
                      id="slot-start"
                      value={slotStart}
                      onChange={setSlotStart}
                      placeholder="Pick start date & time"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slot-end">Block until</Label>
                    <DateTimePicker
                      id="slot-end"
                      value={slotEnd}
                      onChange={setSlotEnd}
                      placeholder="Pick end date & time"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={savingSlot}
                  >
                    {savingSlot ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Block dates
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Blocked & booked ranges
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {slots.length} range{slots.length === 1 ? '' : 's'} — admin
                    blocks plus active guest bookings.
                  </p>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Homestay</TableHead>
                        <TableHead>From → To</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.length ? (
                        slots.map((sl) => {
                          const bookingCount = sl.bookings?.length ?? 0
                          return (
                            <TableRow key={sl.id}>
                              <TableCell className="font-medium">
                                {sl.service.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(sl.start).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                })}{' '}
                                →{' '}
                                {new Date(sl.end).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </TableCell>
                              <TableCell>
                                {bookingCount > 0 ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                    Guest booking
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    Admin blocked
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => askDeleteSlot(sl)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No blocked ranges. All dates are open for guests.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BOOKINGS */}
        <TabsContent value="bookings" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Guest bookings
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage status, Stripe payments, and refunds.
                </p>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Stay & date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length ? (
                      bookings.map((b) => (
                        <TableRow
                          key={b.id}
                          className={b.status === 'cancelled' ? 'opacity-60' : ''}
                        >
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {b.customerName}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {b.customerEmail}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium text-foreground">
                              {b.service.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {b.slot
                                ? new Date(b.slot.start).toLocaleString(
                                    'en-GB',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )
                                : 'No date'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={b.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {b.status !== 'cancelled' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => askCancelBooking(b)}
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Cancelled
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No bookings yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-6 mt-6">
          <BrandingEditor />
        </TabsContent>

        {/* SITE CONTENT (CMS) */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <SiteContentEditor />
        </TabsContent>

        {/* PRICING RULES (CMS) */}
        <TabsContent value="pricing" className="space-y-6 mt-6">
          <PricingSettingsEditor />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => {
          if (!open) setConfirm({ open: false })
        }}
        title={confirm.open ? confirm.title : ''}
        description={confirm.open ? confirm.description : undefined}
        destructive={confirm.open ? confirm.destructive : false}
        confirmLabel={confirm.open && confirm.destructive ? 'Delete' : 'Confirm'}
        onConfirm={confirm.open ? confirm.onConfirm : async () => {}}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={[
            'inline-flex h-11 w-11 items-center justify-center rounded-lg',
            accent
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'confirmed') {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
        <CircleCheck className="h-3 w-3 mr-1" />
        Confirmed
      </Badge>
    )
  }
  if (status === 'cancelled') {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50">
        <CircleX className="h-3 w-3 mr-1" />
        Cancelled
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
      <Hourglass className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  )
}
