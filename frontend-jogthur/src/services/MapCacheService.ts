import { MMKV, MockMMKV } from './MockMMKV';
import { LocationPoint } from '../models';

/**
 * Map tile information
 */
interface MapTile {
  id: string;
  x: number;
  y: number;
  zoom: number;
  url: string;
  data?: string; // Base64 encoded tile data
  timestamp: Date;
  size: number; // Size in bytes
}

/**
 * Cache statistics
 */
interface CacheStatistics {
  totalTiles: number;
  totalSize: number; // in bytes
  oldestTile: Date | null;
  newestTile: Date | null;
  hitRate: number; // percentage
}

/**
 * Cache configuration
 */
interface CacheConfig {
  maxSizeBytes: number;
  maxAgeMs: number;
  preloadRadius: number; // in meters
  tileSize: number; // tile size in pixels
}

/**
 * Bounding box for tile calculation
 */
interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Map cache service for offline tile management
 */
export class MapCacheService {
  private storage: MockMMKV;
  private config: CacheConfig;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.storage = new MMKV({
      id: 'map-cache',
      encryptionKey: 'map-cache-key'
    });

    this.config = {
      maxSizeBytes: 100 * 1024 * 1024, // 100MB default
      maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days default
      preloadRadius: 1000, // 1km default
      tileSize: 256, // Standard tile size
      ...config
    };
  }

  /**
   * Get tile from cache or fetch if not available
   */
  async getTile(x: number, y: number, zoom: number): Promise<MapTile | null> {
    const tileId = this.generateTileId(x, y, zoom);
    
    try {
      const cachedTileData = this.storage.getString(`tile_${tileId}`);
      
      if (cachedTileData) {
        const tile: MapTile = JSON.parse(cachedTileData);
        
        // Check if tile is still valid
        if (this.isTileValid(tile)) {
          this.cacheHits++;
          return tile;
        } else {
          // Remove expired tile
          this.removeTile(tileId);
        }
      }
      
      this.cacheMisses++;
      return null;
    } catch (error) {
      console.error('Error getting tile from cache:', error);
      return null;
    }
  }

  /**
   * Store tile in cache
   */
  async storeTile(tile: MapTile): Promise<boolean> {
    try {
      // Check cache size before storing
      if (await this.shouldEvictTiles()) {
        await this.evictOldTiles();
      }

      const tileData = JSON.stringify(tile);
      this.storage.set(`tile_${tile.id}`, tileData);
      
      // Update cache metadata
      this.updateCacheMetadata(tile);
      
      return true;
    } catch (error) {
      console.error('Error storing tile in cache:', error);
      return false;
    }
  }

  /**
   * Preload tiles for a given route
   */
  async preloadRouteArea(routePoints: LocationPoint[], zoom: number = 15): Promise<void> {
    if (routePoints.length === 0) return;

    try {
      // Calculate bounding box for the route with buffer
      const boundingBox = this.calculateRouteBoundingBox(routePoints);
      const bufferedBox = this.addBufferToBoundingBox(boundingBox, this.config.preloadRadius);
      
      // Get all tiles needed for the area
      const tilesToPreload = this.getTilesForBoundingBox(bufferedBox, zoom);
      
      // Preload tiles in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < tilesToPreload.length; i += batchSize) {
        const batch = tilesToPreload.slice(i, i + batchSize);
        await Promise.all(batch.map(tile => this.preloadTile(tile)));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error preloading route area:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    try {
      const allKeys = this.storage.getAllKeys().filter(key => key.startsWith('tile_'));
      let totalSize = 0;
      let oldestTile: Date | null = null;
      let newestTile: Date | null = null;

      for (const key of allKeys) {
        const tileData = this.storage.getString(key);
        if (tileData) {
          const tile: MapTile = JSON.parse(tileData);
          totalSize += tile.size;
          
          if (!oldestTile || tile.timestamp < oldestTile) {
            oldestTile = tile.timestamp;
          }
          
          if (!newestTile || tile.timestamp > newestTile) {
            newestTile = tile.timestamp;
          }
        }
      }

      const totalRequests = this.cacheHits + this.cacheMisses;
      const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

      return {
        totalTiles: allKeys.length,
        totalSize,
        oldestTile,
        newestTile,
        hitRate
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        totalTiles: 0,
        totalSize: 0,
        oldestTile: null,
        newestTile: null,
        hitRate: 0
      };
    }
  }

  /**
   * Clear all cached tiles
   */
  clearCache(): void {
    try {
      const allKeys = this.storage.getAllKeys().filter(key => key.startsWith('tile_'));
      for (const key of allKeys) {
        this.storage.delete(key);
      }
      
      // Reset statistics
      this.cacheHits = 0;
      this.cacheMisses = 0;
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear expired tiles
   */
  clearExpiredTiles(): number {
    try {
      const allKeys = this.storage.getAllKeys().filter(key => key.startsWith('tile_'));
      let removedCount = 0;

      for (const key of allKeys) {
        const tileData = this.storage.getString(key);
        if (tileData) {
          const tile: MapTile = JSON.parse(tileData);
          if (!this.isTileValid(tile)) {
            this.storage.delete(key);
            removedCount++;
          }
        }
      }

      return removedCount;
    } catch (error) {
      console.error('Error clearing expired tiles:', error);
      return 0;
    }
  }

  /**
   * Generate unique tile ID
   */
  private generateTileId(x: number, y: number, zoom: number): string {
    return `${zoom}_${x}_${y}`;
  }

  /**
   * Check if tile is still valid (not expired)
   */
  private isTileValid(tile: MapTile): boolean {
    const now = new Date();
    const tileAge = now.getTime() - tile.timestamp.getTime();
    return tileAge < this.config.maxAgeMs;
  }

  /**
   * Remove tile from cache
   */
  private removeTile(tileId: string): void {
    this.storage.delete(`tile_${tileId}`);
  }

  /**
   * Check if cache should evict tiles
   */
  private async shouldEvictTiles(): Promise<boolean> {
    const stats = this.getCacheStatistics();
    return stats.totalSize > this.config.maxSizeBytes;
  }

  /**
   * Evict old tiles to make space
   */
  private async evictOldTiles(): Promise<void> {
    try {
      const allKeys = this.storage.getAllKeys().filter(key => key.startsWith('tile_'));
      const tiles: (MapTile & { key: string })[] = [];

      // Load all tiles with their keys
      for (const key of allKeys) {
        const tileData = this.storage.getString(key);
        if (tileData) {
          const tile: MapTile = JSON.parse(tileData);
          tiles.push({ ...tile, key });
        }
      }

      // Sort by timestamp (oldest first)
      tiles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Remove oldest tiles until we're under the size limit
      let currentSize = tiles.reduce((sum, tile) => sum + tile.size, 0);
      const targetSize = this.config.maxSizeBytes * 0.8; // Remove to 80% of limit

      for (const tile of tiles) {
        if (currentSize <= targetSize) break;
        
        this.storage.delete(tile.key);
        currentSize -= tile.size;
      }
    } catch (error) {
      console.error('Error evicting old tiles:', error);
    }
  }

  /**
   * Update cache metadata
   */
  private updateCacheMetadata(tile: MapTile): void {
    // This could be expanded to track more detailed metadata
    // For now, we rely on the tile data itself
  }

  /**
   * Calculate bounding box for route points
   */
  private calculateRouteBoundingBox(routePoints: LocationPoint[]): BoundingBox {
    const latitudes = routePoints.map(p => p.latitude);
    const longitudes = routePoints.map(p => p.longitude);

    return {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes)
    };
  }

  /**
   * Add buffer to bounding box
   */
  private addBufferToBoundingBox(box: BoundingBox, radiusMeters: number): BoundingBox {
    // Convert meters to degrees (approximate)
    const latDegreeBuffer = radiusMeters / 111320; // 1 degree latitude ≈ 111.32 km
    const lngDegreeBuffer = radiusMeters / (111320 * Math.cos(box.north * Math.PI / 180));

    return {
      north: box.north + latDegreeBuffer,
      south: box.south - latDegreeBuffer,
      east: box.east + lngDegreeBuffer,
      west: box.west - lngDegreeBuffer
    };
  }

  /**
   * Get all tiles needed for a bounding box
   */
  private getTilesForBoundingBox(box: BoundingBox, zoom: number): Array<{x: number, y: number, zoom: number}> {
    const tiles: Array<{x: number, y: number, zoom: number}> = [];

    // Convert lat/lng to tile coordinates
    const northWestTile = this.latLngToTile(box.north, box.west, zoom);
    const southEastTile = this.latLngToTile(box.south, box.east, zoom);

    // Generate all tiles in the bounding box
    for (let x = northWestTile.x; x <= southEastTile.x; x++) {
      for (let y = northWestTile.y; y <= southEastTile.y; y++) {
        tiles.push({ x, y, zoom });
      }
    }

    return tiles;
  }

  /**
   * Convert latitude/longitude to tile coordinates
   */
  private latLngToTile(lat: number, lng: number, zoom: number): {x: number, y: number} {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    
    return { x, y };
  }

  /**
   * Preload a single tile
   */
  private async preloadTile(tileInfo: {x: number, y: number, zoom: number}): Promise<void> {
    try {
      // Check if tile is already cached
      const existingTile = await this.getTile(tileInfo.x, tileInfo.y, tileInfo.zoom);
      if (existingTile) {
        return; // Already cached
      }

      // In a real implementation, you would fetch the tile from a map service
      // For now, we'll create a placeholder tile
      const tile: MapTile = {
        id: this.generateTileId(tileInfo.x, tileInfo.y, tileInfo.zoom),
        x: tileInfo.x,
        y: tileInfo.y,
        zoom: tileInfo.zoom,
        url: `https://tile.openstreetmap.org/${tileInfo.zoom}/${tileInfo.x}/${tileInfo.y}.png`,
        timestamp: new Date(),
        size: 1024 // Placeholder size
      };

      await this.storeTile(tile);
    } catch (error) {
      console.error('Error preloading tile:', error);
    }
  }
}

// Export singleton instance
export const mapCacheService = new MapCacheService();
