import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings, updateBookingStatus } from "../../services/bookingService.js";
import { fetchPropertyById } from "../../services/propertyService.js";
import { Loader2, Calendar, MapPin, XCircle, CheckCircle, Clock } from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "student") {
          navigate("/login");
          return;
        }

        const data = await fetchMyBookings();
        
        // The backend returns only the property ID in the booking serializer.
        // We need to fetch property details to display images/titles.
        const bookingsWithProperties = await Promise.all(data.map(async (booking) => {
          try {
            const propertyDetails = await fetchPropertyById(booking.property);
            return { ...booking, propertyDetails };
          } catch (e) {
            return { ...booking, propertyDetails: { title: "Unknown Property", city: "Unknown" } };
          }
        }));

        setBookings(bookingsWithProperties);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [navigate]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await updateBookingStatus(id, "cancelled");
      setBookings((prev) => 
        prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b)
      );
    } catch (err) {
      alert(`Failed to cancel booking: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approved</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'cancelled': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelled</span>;
      case 'completed': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-[#0A2647] animate-spin" />
          <p className="text-gray-500 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-extrabold text-[#091E42] mb-8">My Bookings</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">
            Error: {error}
          </div>
        )}

        {bookings.length === 0 && !error ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-gray-100 shadow-sm">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-[#0A2647]" />
            </div>
            <h2 className="text-xl font-bold text-[#091E42] mb-2">No bookings yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't requested any rooms.</p>
            <button 
              onClick={() => navigate('/find-room')}
              className="bg-[#0A2647] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#153a69] transition"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const prop = booking.propertyDetails;
              const img = prop.images?.length > 0 ? prop.images[0].image : "https://placehold.co/600x400/e2e8f0/1e293b?text=Room";
              
              return (
                <div key={booking.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start transition hover:shadow-md">
                  <img src={img} alt="property" className="w-full md:w-48 h-32 object-cover rounded-xl shrink-0" />
                  
                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-[#091E42]">{prop.title}</h3>
                      <div>{getStatusBadge(booking.status)}</div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4 gap-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {prop.city} {prop.district && `, ${prop.district}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {booking.move_in_date} ({booking.duration_months} months)
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500">
                        Requested on {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                      
                      {(booking.status === "pending" || booking.status === "approved") && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition border border-transparent hover:border-red-200"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
