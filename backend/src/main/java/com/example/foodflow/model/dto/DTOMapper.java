
package com.example.foodflow.model.dto;

import java.util.List;
import java.util.stream.Collectors;

public class DTOMapper {

    public static <E, D> List<D> mapList(List<E> entities, java.util.function.Function<E, D> mapper) {
        if (entities == null) return null;
        return entities.stream().map(mapper).collect(Collectors.toList());
    }
}
