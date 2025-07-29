import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import './OrderSearch.css';

const OrderSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const searchContainerRef = useRef(null);

  // Efecto para buscar sugerencias
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length >= 4) {
        try {
          const { data } = await apiClient.get(
            `/orders/search-by-prefix?prefix=${searchTerm}`
          );
          setSuggestions(data);
          setIsDropdownVisible(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setIsDropdownVisible(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Pequeño retraso para no saturar la API al escribir rápido

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  // Efecto para buscar un pedido exacto (6 dígitos)
  useEffect(() => {
    const fetchExactOrder = async () => {
      if (searchTerm.length === 6) {
        try {
          const { data } = await apiClient.get(
            `/orders/by-number/${searchTerm}`
          );
          setFoundOrder(data);
          setIsDropdownVisible(false); // Ocultamos sugerencias al encontrar uno exacto
        } catch (error) {
          console.log(error);
          console.log('Pedido exacto no encontrado, mostrando sugerencias.');
        }
      }
    };
    fetchExactOrder();
  }, [searchTerm]);

  // Efecto para cerrar el desplegable si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (order) => {
    setSearchTerm(String(order.orderNumber)); // Esto disparará la búsqueda exacta
    setIsDropdownVisible(false);
  };

  const handleCloseModal = () => {
    setFoundOrder(null);
    setSearchTerm('');
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      <input
        type="number"
        className="search-input"
        placeholder="Buscar Pedido..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => searchTerm.length >= 4 && setIsDropdownVisible(true)}
      />

      {isDropdownVisible && (
        <div className="suggestions-dropdown">
          {suggestions.length > 0 ? (
            suggestions.map((order) => (
              <div
                key={order._id}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(order)}
              >
                <span>{order.orderNumber}</span>
                <span className="suggestion-packer">{order.packer}</span>
              </div>
            ))
          ) : (
            <div className="suggestion-item no-results">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}

      {foundOrder && (
        <OrderDetailsModal order={foundOrder} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default OrderSearch;
