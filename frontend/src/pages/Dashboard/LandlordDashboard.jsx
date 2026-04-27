import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../assets/components/Navbar/Navbar.jsx";
import { fetchMyBookings, updateBookingStatus } from "../../services/bookingService.js";
import { fetchPropertyById } from "../../services/propertyService.js";
import { Loader2, Inbox, MapPin, CheckCircle, XCircle, Clock, Check } from 'lucide-react';

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "landlord") {
          navigate("/login");
          return;
        }

        const data = await fetchMyBookings();
        
        const bookingsWithProps = await Promise.all(data.map(async (booking) => {
          try {
            const propertyDetails = await fetchPropertyById(booking.property);
            return { ...booking, propertyDetails };
          } catch (e) {
            return { ...booking, propertyDetails: { title: "Unknown Property", city: "Unknown" } };
          }
        }));

        setBookings(bookingsWithProps);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [navigate]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      setBookings((prev) => 
        prev.map((b) => b.id === id ? { ...b, status: newStatus } : b)
      );
    } catch (err) {
      alert(`Failed to change status: ${err.message}`);
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
          <p className="text-gray-500 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-extrabold text-[#091E42] mb-8">Booking Requests</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">
            Error: {error}
          </div>
        )}

        {bookings.length === 0 && !error ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-gray-100 shadow-sm">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-[#0A2647]" />
            </div>
            <h2 className="text-xl font-bold text-[#091E42] mb-2">No Requests</h2>
            <p className="text-gray-500">You haven't received any booking requests for your properties yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const prop = booking.propertyDetails;
              
              return (
                <div key={booking.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 transition hover:shadow-md">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#091E42] mb-1">{prop.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 gap-1">
                        <MapPin className="w-3 h-3" /> {prop.city}
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold mb-1">Move-in Date</p>
                      <p className="font-semibold text-[#091E42]">{booking.move_in_date}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold mb-1">Duration</p>
                      <p className="font-semibold text-[#091E42]">{booking.duration_months} months</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-xs text-gray-500 font-bold mb-1">Tenant Information</p>
                    <p className="font-medium text-gray-800">User ID: {booking.tenant}</p>
                    {booking.message && (
                      <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 italic text-gray-600 text-xs">
                        "{booking.message}"
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex gap-3">
                    {booking.status === "pending" && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(booking.id, "approved")}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition flex justify-center items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleStatusChange(booking.id, "rejected")}
                          className="flex-1 border border-red-200 text-red-600 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition flex justify-center items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {booking.status === "approved" && (
                      <button 
                        onClick={() => handleStatusChange(booking.id, "completed")}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark as Completed
                      </button>
                    )}
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

export default LandlordDashboard;
