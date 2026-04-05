"use client";

import { useEffect, useState } from "react";
import { getAddresses, saveAddress } from "@/lib/api";
import { MapPin, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Address {
  id: number;
  label?: string | null;
  full_name: string;
  phone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: number;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ address_type: "home", recipient_name: "", recipient_phone: "", address_line1: "", city: "", state: "", pincode: "", is_default: false });
  const [loading, setLoading] = useState(false);

  const load = () =>
    getAddresses()
      .then((rows) => setAddresses(Array.isArray(rows) ? rows : []))
      .catch(() => setAddresses([]));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveAddress(form);
      await load();
      setShowForm(false);
      toast.success("Address saved!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-lg">Saved Addresses</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-xl hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 mb-2">New Address</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "recipient_name", label: "Recipient Name", type: "text", required: true, placeholder: "Full name" },
              { name: "recipient_phone", label: "Phone", type: "tel", required: false, placeholder: "+91 …" },
              { name: "address_line1", label: "Address", type: "text", required: true, placeholder: "Street, area" },
              { name: "city", label: "City", type: "text", required: true, placeholder: "City" },
              { name: "state", label: "State", type: "text", required: true, placeholder: "State" },
              { name: "pincode", label: "Pincode", type: "text", required: true, placeholder: "560001" },
            ].map((f) => (
              <div key={f.name}>
                <label htmlFor={`addr-${f.name}`} className="text-xs text-gray-500 mb-1 block">
                  {f.label}
                </label>
                <input
                  id={`addr-${f.name}`}
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={form[f.name as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_default" checked={form.is_default}
              onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} />
            <label htmlFor="is_default" className="text-sm text-gray-600">Set as default</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? "Saving…" : "Save Address"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No addresses saved yet.</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-gray-800">{addr.full_name}</span>
                {addr.label ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                    {addr.label}
                  </span>
                ) : null}
                {addr.is_default === 1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>}
              </div>
              <p className="text-sm text-gray-600">
                {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                {addr.phone ? <span className="block text-gray-500 mt-0.5">{addr.phone}</span> : null}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
