import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MenuItemsManagement from '@/app/admin/restaurants/[id]/components/MenuItemsManagement'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockMenu = [
  {
    pageNumber: 1,
    items: [[
      {
        id: '1',
        name: 'Dish 1',
        price: 10,
        description: 'Desc 1',
        ingredients: ['a', 'b'],
        texture: ['soft'],
        allergens: ['egg']
      },
      {
        id: '2',
        name: 'Dish 2',
        price: 20,
        description: 'Desc 2',
        ingredients: ['c'],
        texture: ['crispy'],
        allergens: []
      },
      {
        id: '3',
        name: 'Dish 3',
        price: 30,
        description: 'Desc 3',
        ingredients: [],
        texture: [],
        allergens: ['milk']
      },
      {
        id: '4',
        name: 'Dish 4',
        price: 40,
        description: 'Desc 4',
        ingredients: ['d'],
        texture: [],
        allergens: []
      },
      {
        id: '5',
        name: 'Dish 5',
        price: 50,
        description: 'Desc 5',
        ingredients: [],
        texture: ['chewy'],
        allergens: []
      }
    ]]
  }
]

describe('MenuItemsManagement', () => {
  it('renders empty state when no menu', () => {
    render(<MenuItemsManagement rawMenu={[]} />)
    expect(screen.getByText('No menu items available')).toBeInTheDocument()
  })

  it('renders menu items and pagination', () => {
    render(<MenuItemsManagement rawMenu={mockMenu} itemsPerPage={2} />)
    expect(screen.getByText('Dish 1')).toBeInTheDocument()
    expect(screen.getByText('Dish 2')).toBeInTheDocument()
    expect(screen.queryByText('Dish 3')).not.toBeInTheDocument()
    // Click next page
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Dish 3')).toBeInTheDocument()
    expect(screen.getByText('Dish 4')).toBeInTheDocument()
    // Click previous page
    fireEvent.click(screen.getByText('Previous'))
    expect(screen.getByText('Dish 1')).toBeInTheDocument()
  })

  it('opens edit dialog and edits a menu item', async () => {
    render(<MenuItemsManagement rawMenu={mockMenu} itemsPerPage={2} />)
    // Open edit dialog
    fireEvent.click(screen.getAllByRole('button', { name: '' })[0]) // First edit button
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // Modify name
    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Updated Dish' } })
    expect(nameInput).toHaveValue('Updated Dish')
  })

  it('shows success toast on save', async () => {
    const onUpdate = vi.fn()
    render(<MenuItemsManagement rawMenu={mockMenu} itemsPerPage={2} onUpdate={onUpdate} />)
    // Open edit dialog
    fireEvent.click(screen.getAllByRole('button', { name: '' })[0])
    // Modify name
    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Updated Dish' } })
    // Save
    const saveBtn = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveBtn)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Menu item updated successfully')
    })
    expect(onUpdate).toHaveBeenCalled()
  })
}) 