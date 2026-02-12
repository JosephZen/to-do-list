import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function ListItems() {
    const [items, setItems] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Retrieve List ID & Title passed from Home
    // We use "listId" to talk to the database
    const { listId, listTitle } = location.state || {};

    // Redirect if accessed directly without data
    useEffect(() => {
        if (!listId) {
            navigate('/home');
        }
    }, [listId, navigate]);

    // 2. READ: Fetch Items for this specific List
    const fetchItems = async () => {
        if (!listId) return;
        try {
            const response = await axios.get(`/get-items/${listId}`);
            // Note: Your backend sends "succes" (typo) or "success". Checking data directly is safer.
            if (response.data.items) { 
                setItems(response.data.items);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    // Fetch on load
    useEffect(() => {
        fetchItems();
    }, [listId]);

    // 3. CREATE: Add a new Item
    const handleAddItem = async () => {
        const { value: description } = await Swal.fire({
            title: 'New Task',
            input: 'text',
            inputLabel: `Add to "${listTitle}"`,
            inputPlaceholder: 'What needs to be done?',
            showCancelButton: true,
            confirmButtonColor: '#2563EB' // Blue
        });

        if (description) {
            try {
                await axios.post(`/add-item/${listId}`, { itemdescription: description });
                fetchItems(); // Refresh list
                Swal.fire({
                    icon: 'success',
                    title: 'Added!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                Swal.fire('Error', 'Could not add item', 'error');
            }
        }
    };

    // 4. UPDATE: Edit an Item
    const handleEditItem = async (item) => {
        const { value: newDescription } = await Swal.fire({
            title: 'Edit Task',
            input: 'text',
            inputValue: item.description,
            showCancelButton: true,
            confirmButtonText: 'Save',
            confirmButtonColor: '#2563EB'
        });

        if (newDescription) {
            try {
                await axios.put(`/edit-item/${item.id}`, { itemdescription: newDescription });
                fetchItems();
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                Swal.fire('Error', 'Update failed', 'error');
            }
        }
    };

    // 2. TOGGLE STATUS (The Fix)
    const handleToggleStatus = async (item) => {
        // 1. Calculate new status
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';

        try {
            // 2. Optimistic UI Update (Update screen instantly)
            const updatedItems = items.map(i => 
                i.id === item.id ? { ...i, status: newStatus } : i
            );
            
            // Re-sort
            setItems(updatedItems.sort((a, b) => (a.status === 'completed') - (b.status === 'completed')));

            // 3. ✅ THE FIX: Send BOTH status AND description
            // If we don't send itemdescription, the server might overwrite it with NULL
            await axios.put(`/edit-item/${item.id}`, { 
                status: newStatus,
                itemdescription: item.description // <--- THIS LINE SAVES YOUR TEXT
            });
            
        } catch (error) {
            console.error("Failed to toggle", error);
            fetchItems(); // Revert if server fails
        }
    };

    // 5. DELETE: Remove an Item
    const handleDeleteItem = async (itemId) => {
        // Simple confirmation
        const result = await Swal.fire({
            title: 'Finish this task?',
            text: "It will be removed from the list.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981', // Green for "Complete/Delete"
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Complete it!'
        });

        if (result.isConfirmed) {
            try {
                // Backend expects "I_id" in the body for delete
                await axios.delete('/delete-item', { data: { I_id: itemId } });
                fetchItems();
                Swal.fire({
                    icon: 'success',
                    title: 'Completed!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                Swal.fire('Error', 'Delete failed', 'error');
            }
        }
    };

    if (!listId) return null; // Prevents flashing before redirect

    return (
        <>
            <Header taskCount={items.length} />

            <div className="max-w-4xl mx-auto p-6">
                
                {/* Navigation & Title Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/home')} 
                            className="text-sm text-gray-500 hover:text-black transition-colors mb-2 flex items-center gap-1"
                        >
                            ← Back to My Lists
                        </button>
                        <h1 className="text-3xl font-black text-gray-800">
                            {listTitle} 
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {items.length} {items.length === 1 ? 'task' : 'tasks'} remaining
                        </p>
                    </div>

                    <button 
                        onClick={handleAddItem}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-95 shadow-lg flex items-center gap-2"
                    >
                        <span>+</span> Add New Task
                    </button>
                </div>

                {/* Items List Container */}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div 
                            key={item.id} 
                            className={`group border p-4 rounded-xl flex items-center justify-between transition-all
                                ${item.status === 'completed' 
                                    ? 'bg-gray-50 border-gray-100' // Visuals for Completed
                                    : 'bg-white border-gray-200 hover:shadow-md' // Visuals for Pending
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* CHECKBOX */}
                                <input 
                                    type="checkbox" 
                                    checked={item.status === 'completed'} // Checked if text says 'completed'
                                    onChange={() => handleToggleStatus(item)}
                                    className="w-6 h-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                
                                {/* DESCRIPTION */}
                                <span className={`font-medium text-lg transition-all ${
                                    item.status === 'completed' 
                                        ? 'line-through text-gray-400' // Cross out if 'completed'
                                        : 'text-gray-800'
                                }`}>
                                    {item.description}
                                </span>
                            </div>

                            {/* EDIT/DELETE BUTTONS */}
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEditItem(item)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Task"
                                >
                                    ✎
                                </button>
                                <button 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Task"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default ListItems;