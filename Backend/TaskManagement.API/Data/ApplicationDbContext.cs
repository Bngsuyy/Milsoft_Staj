using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Entities;

namespace TaskManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Username).HasMaxLength(50).IsRequired();
                entity.Property(u => u.Email).HasMaxLength(100).IsRequired();
                entity.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(u => u.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(u => u.LastName).HasMaxLength(50).IsRequired();
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
                entity.Property(c => c.Description).HasMaxLength(500);
                entity.Property(c => c.Color).HasMaxLength(7).IsRequired();
                entity.HasIndex(c => new { c.UserId, c.Name }).IsUnique();
            });

            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.Property(t => t.Title).HasMaxLength(200).IsRequired();
                entity.Property(t => t.Description).HasMaxLength(2000);
                entity.ToTable(tableBuilder =>
                {
                    tableBuilder.HasCheckConstraint(
                        "CK_Tasks_Priority",
                        "\"Priority\" BETWEEN 1 AND 5");
                    tableBuilder.HasCheckConstraint(
                        "CK_Tasks_Status",
                        "\"Status\" BETWEEN 0 AND 3");
                });
                entity.HasIndex(t => new { t.UserId, t.Status });
                entity.HasIndex(t => new { t.UserId, t.DueDate });
            });

            modelBuilder.Entity<TaskAttachment>(entity =>
            {
                entity.Property(a => a.FileName).HasMaxLength(255).IsRequired();
                entity.Property(a => a.FilePath).HasMaxLength(500).IsRequired();
                entity.Property(a => a.ContentType).HasMaxLength(100).IsRequired();
            });

            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.Property(c => c.Comment).HasMaxLength(2000).IsRequired();
            });

            // PDF şemasına uygun silme davranışları (FluentAPI)

            // User silinirse ona ait Task, Category ve Comment'ler silinsin (CASCADE)
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Category>()
                .HasOne(c => c.User)
                .WithMany(u => u.Categories)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne(tc => tc.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(tc => tc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Category silinirse Task üzerindeki CategoryId NULL olsun (SET NULL)
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Category)
                .WithMany(c => c.Tasks)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // Task silinirse ona ait Attachment ve Comment'ler silinsin (CASCADE)
            modelBuilder.Entity<TaskAttachment>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne(tc => tc.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(tc => tc.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // Migration modelinin her çalıştırmada değişmemesi için seed değerleri sabittir.
            var demoUserGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var seedDate = new DateTime(2025, 8, 18, 7, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = demoUserGuid,
                Username = "demouser",
                Email = "demo@example.com",
                PasswordHash = "$2a$11$dPWaszZ8p.60zHUUpZRNr.1.2gaCXoeYz1FqAR/U.ZYttsmttFNmS",
                FirstName = "Demo",
                LastName = "User",
                CreatedAt = seedDate,
                UpdatedAt = seedDate,
                IsActive = true
            });
        }
    }
}
