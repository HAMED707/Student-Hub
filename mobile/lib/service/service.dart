import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_cancellable_tile_provider/flutter_map_cancellable_tile_provider.dart';
import 'package:latlong2/latlong.dart';

class NearbyPlacesScreen extends StatefulWidget {
  const NearbyPlacesScreen({super.key});

  @override
  State<NearbyPlacesScreen> createState() => _NearbyPlacesScreenState();
}

class _NearbyPlacesScreenState extends State<NearbyPlacesScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();

  String selectedCategory = "Restaurants";
  List<Map<String, dynamic>> filteredPlaces = [];

  // داتا شاملة وتفاعلية لكل الأقسام
  final Map<String, List<Map<String, dynamic>>> placesData = {
    "Universities": [
      {
        "name": "Cairo University",
        "time": "08:00 - 18:00",
        "rating": 4.8,
        "reviews": 1200,
        "dist": "1.2 km",
        "lat": 30.0275,
        "lng": 31.2089,
      },
      {
        "name": "Ain Shams University",
        "time": "08:00 - 17:00",
        "rating": 4.6,
        "reviews": 950,
        "dist": "5.4 km",
        "lat": 30.0771,
        "lng": 31.2859,
      },
    ],
    "Restaurants": [
      {
        "name": "Super ABO ALY",
        "time": "Open 24 Hours",
        "rating": 4.5,
        "reviews": 230,
        "dist": "2 mins",
        "lat": 30.0444,
        "lng": 31.2357,
      },
      {
        "name": "Tito Ristorante",
        "time": "09:00 - 02:00",
        "rating": 4.3,
        "reviews": 180,
        "dist": "5 mins",
        "lat": 30.0458,
        "lng": 31.2365,
      },
      {
        "name": "Alfanar Food",
        "time": "10:00 - 01:00",
        "rating": 4.4,
        "reviews": 310,
        "dist": "8 mins",
        "lat": 30.0480,
        "lng": 31.2400,
      },
    ],
    "Supermarkets": [
      {
        "name": "Carrefour Express",
        "time": "08:00 - 00:00",
        "rating": 4.2,
        "reviews": 540,
        "dist": "0.5 km",
        "lat": 30.0420,
        "lng": 31.2320,
      },
      {
        "name": "Hyper One",
        "time": "24 Hours",
        "rating": 4.7,
        "reviews": 2100,
        "dist": "12 km",
        "lat": 30.0100,
        "lng": 30.9900,
      },
    ],
    "Hospitals": [
      {
        "name": "Kasr Al-Ainy Hospital",
        "time": "24 Hours",
        "rating": 4.1,
        "reviews": 890,
        "dist": "3.1 km",
        "lat": 30.0310,
        "lng": 31.2275,
      },
      {
        "name": "Cleopatra Hospital",
        "time": "24 Hours",
        "rating": 4.5,
        "reviews": 620,
        "dist": "6.2 km",
        "lat": 30.0910,
        "lng": 31.3300,
      },
    ],
  };

  @override
  void initState() {
    super.initState();
    filteredPlaces = placesData[selectedCategory] ?? [];
  }

  // منطق البحث الشامل
  void _onSearchChanged(String query) {
    setState(() {
      if (query.isEmpty) {
        filteredPlaces = placesData[selectedCategory] ?? [];
      } else {
        List<Map<String, dynamic>> results = [];
        placesData.forEach((category, list) {
          for (var place in list) {
            // بيبحث في اسم المكان أو اسم القسم بتاعه
            if (place['name'].toLowerCase().contains(query.toLowerCase()) ||
                category.toLowerCase().contains(query.toLowerCase())) {
              results.add(place);
            }
          }
        });
        filteredPlaces = results;
      }
    });
  }

  void _moveToLocation(double lat, double lng) {
    _mapController.move(LatLng(lat, lng), 16.5);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // 1. طبقة الخريطة
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(30.0444, 31.2357),
              initialZoom: 14,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.studenthub.app',
                tileProvider: CancellableNetworkTileProvider(),
              ),
              MarkerLayer(
                markers: filteredPlaces
                    .map(
                      (p) => Marker(
                        point: LatLng(p['lat'], p['lng']),
                        width: 45,
                        height: 45,
                        child: GestureDetector(
                          onTap: () => _moveToLocation(p['lat'], p['lng']),
                          child: const Icon(
                            Icons.location_on,
                            color: Colors.red,
                            size: 40,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
          ),

          // 2. الهيدر (البحث + الأزرار)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
              child: Column(
                children: [
                  _buildSearchBar(),
                  const SizedBox(height: 12),
                  _buildCategoryBar(),
                ],
              ),
            ),
          ),

          // 3. القائمة القابلة للسحب للنتائج
          _buildDraggableSheet(),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          prefixIcon: const Icon(Icons.search, color: Colors.blue),
          hintText: "Search (e.g. Supermarket, Cairo Univ...)",
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildCategoryBar() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: placesData.keys.map((cat) {
          bool isSelected = selectedCategory == cat;
          return GestureDetector(
            onTap: () {
              setState(() {
                selectedCategory = cat;
                _searchController.clear();
                filteredPlaces = placesData[cat] ?? [];
              });
              if (filteredPlaces.isNotEmpty) {
                _moveToLocation(
                  filteredPlaces[0]['lat'],
                  filteredPlaces[0]['lng'],
                );
              }
            },
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: isSelected ? Colors.blue : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 5,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  cat,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.blue,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDraggableSheet() {
    return DraggableScrollableSheet(
      initialChildSize: 0.35,
      minChildSize: 0.15,
      maxChildSize: 0.85,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 15)],
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _searchController.text.isEmpty
                          ? "Nearby $selectedCategory"
                          : "Search Results",
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "${filteredPlaces.length} places",
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: filteredPlaces.isEmpty
                    ? const Center(child: Text("No places found"))
                    : ListView.builder(
                        controller: scrollController,
                        padding: EdgeInsets.zero,
                        itemCount: filteredPlaces.length,
                        itemBuilder: (context, index) {
                          final place = filteredPlaces[index];
                          return ListTile(
                            onTap: () =>
                                _moveToLocation(place['lat'], place['lng']),
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: Colors.blue,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              place['name'],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Text(
                              "${place['rating']} ⭐ • ${place['dist']}",
                            ),
                            trailing: const Icon(
                              Icons.directions,
                              color: Colors.blue,
                              size: 20,
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
