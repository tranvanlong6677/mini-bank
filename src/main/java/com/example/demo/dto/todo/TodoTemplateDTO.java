package com.example.demo.dto.todo;

import com.example.demo.entity.TodoTemplateEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoTemplateDTO {

    private Long id;
    private String title;
    private String icon;
    private String priority;
    private Integer sortOrder;

    public static TodoTemplateDTO fromEntity(TodoTemplateEntity entity) {
        return TodoTemplateDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .icon(entity.getIcon())
                .priority(entity.getPriority().name())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
