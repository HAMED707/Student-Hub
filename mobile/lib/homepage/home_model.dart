class HomePropertyModel {
  final String id;
  final String title;
  final String location;
  final double price;
  final double rating;
  final String imageUrl;
  final int roommateCount;
  final String travelTime; // "14 mins from university"

  HomePropertyModel({
    required this.id,
    required this.title,
    required this.location,
    required this.price,
    required this.rating,
    required this.imageUrl,
    required this.roommateCount,
    required this.travelTime,
  });

  factory HomePropertyModel.fromJson(Map<String, dynamic> json) {
    return HomePropertyModel(
      id: json['id'],
      title: json['title'],
      location: json['location'],
      price: json['price'].toDouble(),
      rating: json['rating'].toDouble(),
      imageUrl: json['image_url'],
      roommateCount: json['roommates'],
      travelTime: json['travel_time'],
    );
  }
}
