'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SalaryPayment { id: string; amount: number; month: string; paidAt: string; note?: string }
interface Employee {
  id: string
  name: string
  phone: string
  role: string
  salary: number
  joiningDate: string
  payments: SalaryPayment[]
}

const defaultForm = { name: '', phone: '', role: '', salary: '', joiningDate: '' }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [salaryEmployee, setSalaryEmployee] = useState<Employee | null>(null)
  const [salaryForm, setSalaryForm] = useState({ amount: '', month: '', note: '' })
  const [savingSalary, setSavingSalary] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/employees')
    setEmployees(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowDialog(true) }
  const openEdit = (e: Employee) => {
    setEditing(e)
    setForm({ name: e.name, phone: e.phone, role: e.role, salary: String(e.salary), joiningDate: e.joiningDate.slice(0, 10) })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.role || !form.salary || !form.joiningDate) return toast.error('সব তথ্য পূরণ করুন')
    setSaving(true)
    try {
      const url = editing ? `/api/employees/${editing.id}` : '/api/employees'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salary: parseFloat(form.salary) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? 'আপডেট হয়েছে' : 'যোগ করা হয়েছে')
      setShowDialog(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const handleSalaryPay = async () => {
    if (!salaryEmployee || !salaryForm.amount || !salaryForm.month) return toast.error('পরিমাণ ও মাস দিন')
    setSavingSalary(true)
    try {
      const res = await fetch('/api/employees/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: salaryEmployee.id, amount: parseFloat(salaryForm.amount), month: salaryForm.month, note: salaryForm.note }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('বেতন পরিশোধ হয়েছে')
      setSalaryEmployee(null)
      setSalaryForm({ amount: '', month: '', note: '' })
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSavingSalary(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">কর্মচারী 👷</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">+ নতুন কর্মচারী</button>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">নাম</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পদ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ফোন</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বেতন</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">যোগদান</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">শেষ বেতন</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">কোনো কর্মচারী নেই</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{emp.role}</Badge></td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(emp.salary)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(emp.joiningDate)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {emp.payments?.[0] ? (
                      <span>{emp.payments[0].month} — {formatCurrency(emp.payments[0].amount)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setSalaryEmployee(emp); setSalaryForm({ amount: String(emp.salary), month: new Date().toLocaleString('en', { month: 'long', year: 'numeric' }), note: '' }) }}
                      className="text-green-600 hover:underline text-xs">বেতন</button>
                    <button onClick={() => openEdit(emp)} className="text-blue-600 hover:underline text-xs">এডিট</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">{editing ? 'কর্মচারী এডিট' : 'নতুন কর্মচারী'}</h2></div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'নাম *', placeholder: 'কর্মচারীর নাম' },
                { key: 'phone', label: 'ফোন *', placeholder: '01XXXXXXXXX' },
                { key: 'role', label: 'পদ *', placeholder: 'যেমন: সেলসম্যান, ম্যানেজার' },
                { key: 'salary', label: 'বেতন (৳) *', placeholder: '0' },
                { key: 'joiningDate', label: 'যোগদানের তারিখ *', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''} />
                </div>
              ))}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowDialog(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">বাতিল</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
                {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {salaryEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">বেতন পরিশোধ</h2>
              <p className="text-sm text-gray-500">{salaryEmployee.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">মাস *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={salaryForm.month} onChange={e => setSalaryForm(f => ({ ...f, month: e.target.value }))} placeholder="যেমন: January 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳) *</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={salaryForm.amount} onChange={e => setSalaryForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={salaryForm.note} onChange={e => setSalaryForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setSalaryEmployee(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">বাতিল</button>
              <button onClick={handleSalaryPay} disabled={savingSalary}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {savingSalary ? 'পরিশোধ হচ্ছে...' : '✅ বেতন দিন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
