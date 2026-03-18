package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SurplusPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;



@Repository
public interface SurplusPostRepository extends JpaRepository<SurplusPost, Long>,  
                                               JpaSpecificationExecutor<SurplusPost> {
    
    List<SurplusPost> findByDonorId(Long donorId);
    long countByDonorId(Long donorId);
    
    List<SurplusPost> findByPickupLocation_Address(String address);
    List<SurplusPost> findByPickupLocation_LatitudeAndPickupLocation_Longitude(Double lat, Double lon);

    // All posts that are NOT claimed
    List<SurplusPost> findByStatusNot(PostStatus status);

    // Only claimed posts
    List<SurplusPost> findByStatus(PostStatus status);


    List<SurplusPost> findByStatusIn(List<PostStatus> statuses);


    List<SurplusPost> findByDonorOrderByCreatedAtDesc(User donor);

    /**
     * Find posts within a certain distance using native Haversine formula.
     * This uses a native SQL query which is database-specific but more efficient.
     * 
     * @param latitude User's latitude
     * @param longitude User's longitude  
     * @param maxDistanceKm Maximum distance in kilometers
     * @param status Post status to filter by
     * @return List of posts within the distance
     */
    @Query(value = """
        SELECT * FROM surplus_posts sp
        WHERE sp.status = :status
        AND (
            6371 * acos(
                cos(radians(:latitude)) * 
                cos(radians(sp.latitude)) * 
                cos(radians(sp.longitude) - radians(:longitude)) + 
                sin(radians(:latitude)) * 
                sin(radians(sp.latitude))
            )
        ) <= :maxDistanceKm
        """, nativeQuery = true)
    List<SurplusPost> findByLocationWithinDistance(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("maxDistanceKm") Double maxDistanceKm,
        @Param("status") String status
    );

    /**
     * Find posts within distance AND matching food categories.
     */
    @Query(value = """
        SELECT DISTINCT sp.* FROM surplus_posts sp
        INNER JOIN surplus_post_food_types spft ON sp.id = spft.surplus_post_id
        WHERE sp.status = :status
        AND spft.food_category IN (:foodCategories)
        AND (
            6371 * acos(
                cos(radians(:latitude)) * 
                cos(radians(sp.latitude)) * 
                cos(radians(sp.longitude) - radians(:longitude)) + 
                sin(radians(:latitude)) * 
                sin(radians(sp.latitude))
            )
        ) <= :maxDistanceKm
        """, nativeQuery = true)
    List<SurplusPost> findByLocationAndFoodCategories(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("maxDistanceKm") Double maxDistanceKm,
        @Param("foodCategories") List<String> foodCategories,
        @Param("status") String status
    );

}
