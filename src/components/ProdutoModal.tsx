'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ProdutoForm {
  codigo: string
  nome: string
  preco: number
  estoque: number
  situacao: string
  categoria: string
  tags: string
}

interface ProdutoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProdutoForm, id?: number) => void
  produto?: {
    id: number
    codigo: string
    nome: string
    preco: number
    estoque: { saldoVirtualTotal: number }
    situacao: string
    categoria?: string
    tags?: string
  }
}

export default function ProdutoModal({ isOpen, onClose, onSave, produto }: ProdutoModalProps) {
  const [form, setForm] = useState<ProdutoForm>({
    codigo: '',
    nome: '',
    preco: 0,
    estoque: 0,
    situacao: 'A',
    categoria: '',
    tags: '',
  })

  useEffect(() => {
    if (produto) {
      setForm({
        codigo: produto.codigo || '',
        nome: produto.nome || '',
        preco: produto.preco || 0,
        estoque: produto.estoque?.saldoVirtualTotal || 0,
        situacao: produto.situacao || 'A',
        categoria: produto.categoria || '',
        tags: produto.tags || '',
      })
    } else {
      setForm({ codigo: '', nome: '', preco: 0, estoque: 0, situacao: 'A', categoria: '', tags: '' })
    }
  }, [produto, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ex: Bíblias, Terços..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="Ex: LUXO, PROMO..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.preco}
                onChange={e => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
              <input
                type="number"
                value={form.estoque}
                onChange={e => setForm({ ...form, estoque: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
            <select
              value={form.situacao}
              onChange={e => setForm({ ...form, situacao: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="A">Ativo</option>
              <option value="I">Inativo</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form, produto?.id)}
            className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
          >
            {produto ? 'Salvar' : 'Criar Produto'}
          </button>
        </div>
      </div>
    </div>
  )
}