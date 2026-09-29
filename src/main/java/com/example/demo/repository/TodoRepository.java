package com.example.demo.repository;

import com.example.demo.entity.TodoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository cho Todo operations
 */
@Repository
public interface TodoRepository extends JpaRepository<TodoEntity, Long> {

    /**
     * Lấy tất cả todos của user, sắp xếp theo dueDate và priority
     */
    List<TodoEntity> findByUserIdOrderByDueDateAscPriorityDesc(Long userId);

    /**
     * Lấy todos của user theo ngày cụ thể
     */
    List<TodoEntity> findByUserIdAndDueDateOrderByPriorityDescCreatedAtAsc(Long userId, LocalDate dueDate);

    /**
     * Lấy todos của user trong khoảng ngày
     */
    @Query("SELECT t FROM TodoEntity t WHERE t.userId = :userId " +
           "AND t.dueDate BETWEEN :startDate AND :endDate " +
           "ORDER BY t.dueDate ASC, t.priority DESC")
    List<TodoEntity> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Lấy todos chưa hoàn thành của user
     */
    List<TodoEntity> findByUserIdAndCompletedFalseOrderByDueDateAscPriorityDesc(Long userId);

    /**
     * Lấy todos đã hoàn thành của user
     */
    List<TodoEntity> findByUserIdAndCompletedTrueOrderByUpdatedAtDesc(Long userId);

    /**
     * Đếm số todos chưa hoàn thành của user theo ngày
     */
    Long countByUserIdAndDueDateAndCompletedFalse(Long userId, LocalDate dueDate);

    /**
     * Lấy todos quá hạn (chưa hoàn thành và dueDate < today)
     */
    @Query("SELECT t FROM TodoEntity t WHERE t.userId = :userId " +
           "AND t.completed = false AND t.dueDate < :today " +
           "ORDER BY t.dueDate ASC")
    List<TodoEntity> findOverdueTodos(
        @Param("userId") Long userId,
        @Param("today") LocalDate today
    );

    /**
     * Lấy danh sách các ngày có todo của user (để hiển thị calendar)
     */
    @Query("SELECT DISTINCT t.dueDate FROM TodoEntity t WHERE t.userId = :userId " +
           "AND t.dueDate BETWEEN :startDate AND :endDate")
    List<LocalDate> findDistinctDueDates(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
