"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Key, Plus, Trash2, CheckCircle, XCircle, Star, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { GeminiKey } from "@/lib/gemini-key-service"

export default function GeminiSettingsPage() {
    const router = useRouter()
    const [keys, setKeys] = useState<GeminiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [newKey, setNewKey] = useState("")
    const [newLabel, setNewLabel] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            const res = await fetch("/api/admin/gemini-keys")
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            } else {
                // Fallback for demo or if table missing
                console.error("Failed to fetch keys")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newKey.trim()) return

        setIsSubmitting(true)
        setError("")

        try {
            const res = await fetch("/api/admin/gemini-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: newKey.trim(), label: newLabel.trim() }),
            })

            if (!res.ok) {
                throw new Error("Failed to add key. Ensure database table exists.")
            }

            setNewKey("")
            setNewLabel("")
            fetchKeys()
        } catch (err: any) {
            setError(err.message || "Error adding key")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this API key?")) return

        try {
            await fetch(`/api/admin/gemini-keys?id=${id}`, { method: "DELETE" })
            fetchKeys()
        } catch (err) {
            console.error(err)
        }
    }

    const handleSetPrimary = async (id: string) => {
        try {
            await fetch("/api/admin/gemini-keys", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "set_primary" }),
            })
            fetchKeys()
        } catch (err) {
            console.error(err)
        }
    }

    const handleToggleActive = async (id: string) => {
        try {
            await fetch("/api/admin/gemini-keys", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "toggle_active" }),
            })
            fetchKeys()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 space-x-4">
                        <Link
                            href="/admin/settings"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-300" />
                        <h1 className="text-xl font-bold text-gray-900">Gemini API Configuration</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <Key className="w-8 h-8 text-purple-600" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                                <p className="text-sm text-gray-500">Manage Google Gemini API keys. The system uses the Primary key first, then falls back to others.</p>
                            </div>
                        </div>
                    </div>

                    {/* Add Key Form */}
                    <form onSubmit={handleAddKey} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New API Key</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. 'Pro Account')"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-6">
                                <input
                                    type="text"
                                    placeholder="AIzaSy..."
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Add</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="mt-3 flex items-center text-red-600 text-sm">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        )}
                    </form>

                    {/* Keys List */}
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No API keys found in database.</p>
                            <p className="text-xs text-gray-400 mt-1">The system is likely using Environment Variables as fallback.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key (Preview)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {keys.map((key) => (
                                        <tr key={key.id} className={key.is_primary ? "bg-purple-50/50" : ""}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {key.is_primary && (
                                                        <Star className="w-4 h-4 text-amber-500 mr-2 fill-amber-500" />
                                                    )}
                                                    <button onClick={() => handleToggleActive(key.id)} title={key.is_active ? "Deactivate" : "Activate"}>
                                                        {key.is_active ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {key.label || "Untitled"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {key.key_value.substring(0, 8)}...{key.key_value.substring(key.key_value.length - 4)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {key.error_count > 0 ? (
                                                    <span className="text-red-500 font-medium">{key.error_count}</span>
                                                ) : (
                                                    <span className="text-green-500">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {!key.is_primary && key.is_active && (
                                                        <button
                                                            onClick={() => handleSetPrimary(key.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-xs"
                                                        >
                                                            Set Primary
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(key.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
