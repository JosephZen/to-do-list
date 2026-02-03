import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Home() {
    const [lists, setLists] = useState([]);
    const navigate = useNavigate();

    // 1. FETCH DATA
    const fetchLists = async () => {
        try {
            const response = await axios.get('/get-list');
            if (response.data.success) {
                setLists(response.data.list);
            }
        } catch (error) {
            console.error("Error fetching lists:", error);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    // 2. CREATE LIST
    const handleCreateList = async () => {
        const { value: title } = await Swal.fire({
            title: 'Create New List',
            input: 'text',
            inputPlaceholder: 'e.g., Groceries, Project Ideas...',
            showCancelButton: true,
            confirmButtonColor: '#2563EB',
            inputValidator: (value) => {
                if (!value) return 'You need to write a title!'
            }
        });

        if (title) {
            try {
                await axios.post('/add-list', { listTitle: title });
                fetchLists(); 
                const Toast = Swal.mixin({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
                });
                Toast.fire({ icon: 'success', title: 'List created' });
            } catch (error) {
                Swal.fire('Error', 'Could not create list', 'error');
            }
        }
    };

    // 3. DELETE LIST
    const handleDeleteList = async (e, id) => {
        e.stopPropagation(); 
        const result = await Swal.fire({
            title: 'Delete this list?',
            text: "All tasks inside it will be lost.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete('/delete-list', { data: { L_id: id } });
                fetchLists();
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire('Error', 'Could not delete list', 'error');
            }
        }
    };

    // 4. EDIT LIST
    const handleEditList = async (e, list) => {
        e.stopPropagation();
        const { value: newTitle } = await Swal.fire({
            title: 'Rename List',
            input: 'text',
            inputValue: list.title,
            showCancelButton: true,
            confirmButtonText: 'Save'
        });

        if (newTitle) {
            try {
                await axios.put(`/edit-list/${list.id}`, { listTitle: newTitle });
                fetchLists();
                const Toast = Swal.mixin({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
                });
                Toast.fire({ icon: 'success', title: 'Renamed' });
            } catch (error) {
                Swal.fire('Error', 'Update failed', 'error');
            }
        }
    };

    // 5. NAVIGATE
    const handleCardClick = (list) => {
        navigate('/LT', { state: { listId: list.id, listTitle: list.title } });
    };

    // ... inside Home function ...
    
    console.log("Current Lists Data:", lists); // 👈 Check your browser console!
       // ... HTML ...
    return (
        <>
            <Header taskCount={lists.length} />

            <div className="max-w-7xl mx-auto p-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800">My Collections</h2>
                        <p className="text-gray-500 mt-1">Organize your tasks efficiently</p>
                    </div>
                    <button 
                        onClick={handleCreateList}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-95 shadow-lg flex items-center gap-2"
                    >
                        <span>+</span> New List
                    </button>
                </div>

                {/* ... inside Home.jsx return statement ... */}
                {/* ✅ GRID LAYOUT: 'auto-rows-fr' and 'grid-flow-dense' help pack mixed sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)] grid-flow-dense">
                    
                    {lists.map((list) => {
                        // LOGIC: If a list has more than 3 tasks, make it BIG (2x2)
                        // Note: task_count comes from the DB as a string, so we parse it.
                        const isLarge = parseInt(list.task_count) > 3;

                        return (
                            <div 
                                key={list.id} 
                                onClick={() => handleCardClick(list)}
                                className={`group relative bg-white border border-gray-200 hover:border-blue-400 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between
                                    ${isLarge ? 'md:col-span-2 md:row-span-2 bg-blue-50/30' : 'col-span-1'}
                                `}
                            >
                                {/* Card Content */}
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 
                                            ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                                            {list.title}
                                        </h3>
                                        {/* Task Counter Badge */}
                                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                                            {list.task_count}
                                        </span>
                                    </div>
                                    
                                    {/* Decorative Notebook Line */}
                                    <div className={`rounded-full mt-3 group-hover:bg-blue-100 transition-colors
                                        ${isLarge ? 'w-24 h-2 bg-blue-200' : 'w-12 h-1 bg-gray-100'}`}>
                                    </div>

                                    {/* Show a preview text if it's a big card */}
                                    {isLarge && (
                                        <p className="mt-4 text-gray-500 text-sm">
                                            This is a busy list! You have many tasks pending here. 
                                            Click to manage your {list.task_count} items.
                                        </p>
                                    )}
                                </div>

                                {/* Footer / Actions */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {isLarge ? 'Manage Heavy List →' : 'Open →'}
                                    </span>
                                    
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleEditList(e, list)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteList(e, list.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* "Create New" Ghost Card */}
                    <div 
                        onClick={handleCreateList}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer min-h-[180px]"
                    >
                        <span className="text-4xl mb-2">+</span>
                        <span className="font-bold">Add List</span>
                    </div>

                </div>

                {/* Empty State (Only if absolutely no lists exist) */}
                {lists.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">You don't have any lists yet.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default Home;