import React from 'react';
import { render, screen } from '@testing-library/react';
import ReceivingRoomScreen from './app_receiving-room_page';

test('renders loading then screen', async () => {
  render(<ReceivingRoomScreen />);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});