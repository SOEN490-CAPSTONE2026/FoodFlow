
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Package, MapPin, Calendar, ArrowRight, Filter } from 'lucide-react';
import Select from 'react-select';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import "./Receiver_Styles/ReceiverClaimedDonations.css";

const mockDonations = [
  {
    id: 1,
    status: 'Claimed',
    foodType: 'canned-goods',
    title: 'Canned Goods & Pantry Items',
    quantity: '40+ assorted items',
    location: 'IGA Extra Supermarché',
    date: 'October 19, 2025',
    pickupDate: '2025-10-19'
  },
  {
    id: 2,
    status: 'Claimed',
    foodType: 'soup',
    title: 'Homemade Soup & Stew',
    quantity: '8 containers (2L each)',
    location: "Restaurant L'Avenue",
    date: 'October 18, 2025',
    pickupDate: '2025-10-18'
  },
  {
    id: 3,
    status: 'Claimed',
    foodType: 'vegetables',
    title: 'Assorted Vegetables',
    quantity: '12 kg mixed vegetables',
    location: 'Metro Plus Laurier',
    date: 'October 17, 2025',
    pickupDate: '2025-10-17'
  },
  {
    id: 4,
    status: 'Ready for Pickup',
    foodType: 'sandwiches',
    title: 'Prepared Sandwiches',
    quantity: '20 sandwiches',
    location: 'Cafe Olimpico',
    date: 'October 16, 2025',
    pickupDate: '2025-10-16'
  },
  {
    id: 5,
    status: 'Ready for Pickup',
    foodType: 'pastries',
    title: 'Assorted Pastries & Croissants',
    quantity: '25 pieces',
    location: 'Pâtisserie Kouign-Amann',
    date: 'October 16, 2025',
    pickupDate: '2025-10-16'
  },
  {
    id: 6,
    status: 'Ready for Pickup',
    foodType: 'bread',
    title: 'Fresh Bread Loaves',
    quantity: '6 loaves',
    location: 'Boulangerie Rosemont',
    date: 'October 16, 2025',
    pickupDate: '2025-10-16'
  },
  {
    id: 7,
    status: 'Completed',
    foodType: 'dairy',
    title: 'Dairy Products Bundle',
    quantity: '8 yogurt containers, 4 milk cartons',
    location: 'Provigo Le Marché',
    date: 'October 14, 2025',
    pickupDate: '2025-10-14'
  },
  {
    id: 8,
    status: 'Completed',
    foodType: 'fruits',
    title: 'Fresh Fruit Mix',
    quantity: '15 lbs assorted fruits',
    location: 'Marché Jean-Talon Vendor',
    date: 'October 12, 2025',
    pickupDate: '2025-10-12'
  }
];

export default function ReceiverClaimedDonations() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ value: 'date', label: 'Sort by Date' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'status', label: 'Sort by Status' }
  ];

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      // const { data } = await surplusAPI.list();
      // setItems(Array.isArray(data) ? data : []);

      setError(null);
    } catch (e) {
      setError('Failed to load available donations');
      console.error('fetchDonations error:', e);
    } finally {
      setLoading(false);
    }
  }, []);
  const getFoodTypeImage = (foodType) => {
    switch (foodType) {
      case 'Bakery & Pastry':
        return BakeryPastryImage;
      case 'Fruits & Vegetables':
        return FruitsVeggiesImage;
      case 'Packaged / Pantry Items':
        return PackagedPantryImage;
      case 'Dairy & Cold Items':
        return DairyColdImage;
      case 'Frozen Food':
        return FrozenFoodImage;
      case 'Prepared Meals':
        return PreparedMealsImage;
      default:
        return PreparedMealsImage;
    }
  };

  const getFoodImageClass = (foodType) => {
    switch (foodType) {
      case 'Bakery & Pastry':
        return 'claimed-food-image-bakery';
      case 'Fruits & Vegetables':
        return 'claimed-food-image-fruits-veg';
      case 'Packaged / Pantry Items':
        return 'claimed-food-image-packaged';
      case 'Dairy & Cold Items':
        return 'claimed-food-image-dairy';
      case 'Frozen Food':
        return 'claimed-food-image-frozen';
      case 'Prepared Meals':
        return 'claimed-food-image-prepared';
      default:
        return 'claimed-food-image-packaged';
    }
  };
  const getStatusCount = (status) => {
    if (status === 'All') return mockDonations.length;
    if (status === 'Ready') return mockDonations.filter(d => d.status === 'Ready for Pickup').length;
    return mockDonations.filter(d => d.status === status).length;
  };

  const filters = [
    { name: 'All', count: getStatusCount('All') },
    { name: 'Claimed', count: getStatusCount('Claimed') },
    { name: 'Ready', count: getStatusCount('Ready') },
    { name: 'Completed', count: getStatusCount('Completed') }
  ];
  const filteredDonations = activeFilter === 'All'
    ? mockDonations
    : mockDonations.filter(d => {
      if (activeFilter === 'Ready') return d.status === 'Ready for Pickup';
      return d.status === activeFilter;
    });

  return (
    <div className="claimed-donations-container ">
      <h1>My Claimed Donations</h1>
      <p className="claimed-subtitle">Track your donations and get ready for pickup — every claim helps reduce waste and feed our community.</p>

      {/* Filters and Sort */}
      <div className="donation-filters-container">
        <div className="donation-filter-buttons">
          {filters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`filter-btn ${activeFilter === filter.name ? 'active' : ''}`}
            >
              <span>{filter.name}</span> <span className="donation-filter-count">({filter.count})</span>
            </button>
          ))}
        </div>

        <div className="donation-sort-dropdown">
          <Filter
            size={24}
            className="donation-filter-icon"
            style={{ color: "#364153", opacity: 0.6 }}
          />
          <Select
            value={sortBy}
            onChange={(selectedOption) => setSortBy(selectedOption)}
            options={sortOptions}
            classNamePrefix="react-select"
          />
        </div>
      </div>
    </div>);
}
