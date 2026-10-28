package com.shop.repository;

import com.shop.dto.request.ProductSearchCriteria;
import com.shop.entity.Product;
import com.shop.entity.ProductVariant;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> buildSpecification(ProductSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (Boolean.TRUE.equals(criteria.getActiveOnly())) {
                predicates.add(cb.equal(root.get("active"), true));
            }

            if (criteria.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), criteria.getCategoryId()));
            }

            if (StringUtils.hasText(criteria.getCategoryName())) {
                predicates.add(cb.like(cb.lower(root.get("category").get("name")), "%" + criteria.getCategoryName().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(criteria.getGender())) {
                predicates.add(cb.equal(cb.upper(root.get("gender")), criteria.getGender().toUpperCase()));
            }

            if (StringUtils.hasText(criteria.getStyle())) {
                predicates.add(cb.equal(cb.upper(root.get("style")), criteria.getStyle().toUpperCase()));
            }

            if (StringUtils.hasText(criteria.getColor())) {
                predicates.add(cb.equal(cb.upper(root.get("color")), criteria.getColor().toUpperCase()));
            }

            if (StringUtils.hasText(criteria.getOccasion())) {
                predicates.add(cb.like(cb.lower(root.get("occasion")), "%" + criteria.getOccasion().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(criteria.getSeason())) {
                predicates.add(cb.equal(cb.upper(root.get("season")), criteria.getSeason().toUpperCase()));
            }

            if (StringUtils.hasText(criteria.getMaterial())) {
                predicates.add(cb.like(cb.lower(root.get("material")), "%" + criteria.getMaterial().toLowerCase() + "%"));
            }

            if (criteria.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), criteria.getMinPrice()));
            }

            if (criteria.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), criteria.getMaxPrice()));
            }

            if (StringUtils.hasText(criteria.getSearch())) {
                String searchPattern = "%" + criteria.getSearch().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(nameLike, descLike));
            }

            if (criteria.getKeywords() != null && !criteria.getKeywords().isEmpty()) {
                List<Predicate> keywordPredicates = new ArrayList<>();
                for (String kw : criteria.getKeywords()) {
                    if (StringUtils.hasText(kw)) {
                        String pattern = "%" + kw.trim().toLowerCase() + "%";
                        Predicate nLike = cb.like(cb.lower(root.get("name")), pattern);
                        Predicate dLike = cb.like(cb.lower(root.get("description")), pattern);
                        Predicate cLike = cb.like(cb.lower(root.get("color")), pattern);
                        Predicate sLike = cb.like(cb.lower(root.get("style")), pattern);
                        keywordPredicates.add(cb.or(nLike, dLike, cLike, sLike));
                    }
                }
                if (!keywordPredicates.isEmpty()) {
                    predicates.add(cb.and(keywordPredicates.toArray(new Predicate[0])));
                }
            }

            if (StringUtils.hasText(criteria.getSize())) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.INNER);
                predicates.add(cb.equal(cb.upper(variantJoin.get("size")), criteria.getSize().toUpperCase()));
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
