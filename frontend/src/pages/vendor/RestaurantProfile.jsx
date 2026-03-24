import React from 'react';
import { useParams } from 'react-router-dom';
import VendorRestaurantEditor from './VendorRestaurantEditor';

const RestaurantProfile = () => {
  const { restaurantId } = useParams();
  const isNew = restaurantId === 'new';

  return (
    <VendorRestaurantEditor restaurantId={restaurantId} isNew={isNew} variant="page" />
  );
};

export default RestaurantProfile;
