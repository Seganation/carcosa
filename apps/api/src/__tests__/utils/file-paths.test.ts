import { describe, it, expect } from 'vitest';
import { generateFilePath, type ProjectContext } from '../../utils/file-paths.js';

describe('File Paths Utils', () => {
  describe('generateFilePath', () => {
    const baseContext: ProjectContext = {
      organizationSlug: 'acme',
      teamSlug: 'engineering',
      projectSlug: 'api',
    };

    it('should generate a path with all components', () => {
      const path = generateFilePath(baseContext, 'avatar.png');
      expect(path).toBe('acme/engineering/api/avatar.png');
    });

    it('should handle tenant-scoped paths', () => {
      const path = generateFilePath(baseContext, 'document.pdf', {
        tenantSlug: 'tenant-123',
      });

      expect(path).toBe('acme/engineering/api/tenants/tenant-123/document.pdf');
    });

    it('should handle versioned paths', () => {
      const path = generateFilePath(baseContext, 'data.json', {
        version: 'v2',
      });

      expect(path).toBe('acme/engineering/api/versions/v2/data.json');
    });

    it('should handle transform paths', () => {
      const path = generateFilePath(baseContext, 'image.jpg', {
        transform: 'thumbnail',
      });

      expect(path).toBe('acme/engineering/api/transforms/thumbnail/image.jpg');
    });

    it('should handle combined options', () => {
      const path = generateFilePath(baseContext, 'photo.jpg', {
        tenantSlug: 'tenant-456',
        version: 'v3',
        transform: 'large',
      });

      expect(path).toContain('acme/engineering/api');
      expect(path).toContain('tenants/tenant-456');
      expect(path).toContain('photo.jpg');
    });
  });
});
