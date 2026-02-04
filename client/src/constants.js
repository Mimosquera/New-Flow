/**
 * Shared constants and data
 */

export const SERVICES = [
  { id: 1, name: 'Haircut', price: '$25', description: 'Classic men\'s haircut' },
  { id: 2, name: 'Fade', price: '$30', description: 'Modern fade with details' },
  { id: 3, name: 'Beard Trim', price: '$15', description: 'Professional beard shaping' },
  { id: 4, name: 'Hair Coloring', price: '$50', description: 'Professional coloring service' },
  { id: 5, name: 'Kids Haircut', price: '$20', description: 'Haircuts for children' },
  { id: 6, name: 'Styling', price: '$35', description: 'Special occasion styling' }
];

export const SERVICE_OPTIONS = [
  { value: 'haircut', label: 'Haircut - $25' },
  { value: 'fade', label: 'Fade - $30' },
  { value: 'beard', label: 'Beard Trim - $15' },
  { value: 'coloring', label: 'Hair Coloring - $50' },
  { value: 'kids', label: 'Kids Haircut - $20' },
  { value: 'styling', label: 'Styling - $35' }
];

export const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30'
];

export const INITIAL_NEWS = [
  {
    id: 1,
    title: 'Launch of New Website!',
    content: 'Book appointments online now',
    date: '02/01/2026',
    author: 'Admin'
  },
  {
    id: 2,
    title: 'New Barbers on Staff',
    content: 'Meet our talented team of experienced barbers and stylists',
    date: '01/10/2026',
    author: 'Admin'
  },
  {
    id: 3,
    title: 'Happy New Years!',
    content: 'Start 2026 with a new look',
    date: '01/01/2026',
    author: 'Admin'
  }
];
