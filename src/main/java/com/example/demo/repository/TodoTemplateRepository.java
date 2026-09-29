package com.example.demo.repository;

import com.example.demo.entity.TodoTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoTemplateRepository extends JpaRepository<TodoTemplateEntity, Long> {
    
    List<TodoTemplateEntity> findByUserIdOrderBySortOrderAsc(Long userId);
    
    Long countByUserId(Long userId);
}
