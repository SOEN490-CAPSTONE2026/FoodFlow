import React, { useEffect, useState } from 'react';
import { surplusAPI } from '../../services/api';
import {
  getTemperatureCategoryLabel,
  getPackagingTypeLabel,
} from '../../constants/foodConstants';
import { Package, Thermometer } from 'lucide-react';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
  const [complianceData, setComplianceData] = useState({
    temperatureDistribution: {},
    packagingDistribution: {},
    totalPosts: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      // Fetch all surplus posts (admins should have access to all posts)
      const response = await surplusAPI.list();
      const posts = response.data || [];

      // Calculate distribution
      const tempDist = {};
      const packDist = {};
      const total = posts.length;

      posts.forEach(post => {
        if (post.temperatureCategory) {
          tempDist[post.temperatureCategory] =
            (tempDist[post.temperatureCategory] || 0) + 1;
        }
        if (post.packagingType) {
          packDist[post.packagingType] =
            (packDist[post.packagingType] || 0) + 1;
        }
      });

      setComplianceData({
        temperatureDistribution: tempDist,
        packagingDistribution: packDist,
        totalPosts: total,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setComplianceData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load compliance data',
      }));
    }
  };

  const calculatePercentage = (count, total) => {
    if (total === 0) {
      return 0;
    }
    return ((count / total) * 100).toFixed(1);
  };

  if (complianceData.loading) {
    return (
      <div className="admin-analytics">
        <h2>Food Safety Compliance Analytics</h2>
        <p>Loading compliance data...</p>
      </div>
    );
  }

  if (complianceData.error) {
    return (
      <div className="admin-analytics">
        <h2>Food Safety Compliance Analytics</h2>
        <p className="error-message">{complianceData.error}</p>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <h2>Food Safety Compliance Analytics</h2>
      <p className="analytics-subtitle">
        Monitor temperature and packaging compliance across all donations
      </p>

      <div className="analytics-grid">
        {/* Temperature Category Distribution */}
        <div className="analytics-card">
          <div className="card-header">
            <Thermometer size={20} />
            <h3>Temperature Categories</h3>
          </div>
          <div className="distribution-table">
            {Object.keys(complianceData.temperatureDistribution).length > 0 ? (
              <>
                {Object.entries(complianceData.temperatureDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="distribution-row">
                      <span className="category-name">
                        {getTemperatureCategoryLabel(category)}
                      </span>
                      <div className="count-bar">
                        <div
                          className="bar-fill temperature"
                          style={{
                            width: `${calculatePercentage(count, complianceData.totalPosts)}%`,
                          }}
                        />
                      </div>
                      <span className="category-count">
                        {count} (
                        {calculatePercentage(count, complianceData.totalPosts)}
                        %)
                      </span>
                    </div>
                  ))}
              </>
            ) : (
              <p className="no-data">No temperature data available</p>
            )}
          </div>
        </div>

        {/* Packaging Type Distribution */}
        <div className="analytics-card">
          <div className="card-header">
            <Package size={20} />
            <h3>Packaging Types</h3>
          </div>
          <div className="distribution-table">
            {Object.keys(complianceData.packagingDistribution).length > 0 ? (
              <>
                {Object.entries(complianceData.packagingDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="distribution-row">
                      <span className="category-name">
                        {getPackagingTypeLabel(type)}
                      </span>
                      <div className="count-bar">
                        <div
                          className="bar-fill packaging"
                          style={{
                            width: `${calculatePercentage(count, complianceData.totalPosts)}%`,
                          }}
                        />
                      </div>
                      <span className="category-count">
                        {count} (
                        {calculatePercentage(count, complianceData.totalPosts)}
                        %)
                      </span>
                    </div>
                  ))}
              </>
            ) : (
              <p className="no-data">No packaging data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <p>
          Total donations analyzed: <strong>{complianceData.totalPosts}</strong>
        </p>
      </div>
    </div>
  );
}
