import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, Map as MapIcon, List as ListIcon } from 'lucide-react';
import EquipmentCard from '../components/EquipmentCard';
import EquipmentMap from '../components/EquipmentMap';
import { getEquipment } from '../api';

const Search = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [equipmentList, setEquipmentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const { data } = await getEquipment();
                setEquipmentList(data.data || []);
            } catch (error) {
                console.error("Failed to fetch equipment", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, []);

    const filteredEquipment = equipmentList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Search Header */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center border rounded-md px-3 py-2 bg-gray-50">
                        <SearchIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search tractors, harvesters..."
                            className="w-full bg-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center px-4 py-2 border rounded-md ${viewMode === 'list' ? 'bg-green-100 text-green-700 border-green-500' : 'hover:bg-gray-50'}`}
                        >
                            <ListIcon className="h-5 w-5 mr-2" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center justify-center px-4 py-2 border rounded-md ${viewMode === 'map' ? 'bg-green-100 text-green-700 border-green-500' : 'hover:bg-gray-50'}`}
                        >
                            <MapIcon className="h-5 w-5 mr-2" />
                            Map
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading equipment...</div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Map View (Always visible on large screens or when toggled) */}
                    <div className={`lg:w-1/2 h-[500px] ${viewMode === 'map' ? 'block' : 'hidden lg:block'}`}>
                        <div className="sticky top-4 h-full">
                            <EquipmentMap equipment={filteredEquipment} />
                        </div>
                    </div>

                    {/* List View */}
                    <div className={`lg:w-1/2 ${viewMode === 'list' ? 'block' : 'hidden lg:block'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredEquipment.length > 0 ? (
                                filteredEquipment.map(item => (
                                    <EquipmentCard key={item._id} equipment={item} />
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-2 text-center">No equipment found matching your criteria.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
