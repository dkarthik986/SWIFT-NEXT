package com.example.mongobackend.controller;

import com.example.mongobackend.dto.DropdownOptionsResponse;
import com.example.mongobackend.dto.PagedResponse;
import com.example.mongobackend.dto.SearchResponse;
import com.example.mongobackend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SearchController {

    private final SearchService searchService;
    @GetMapping("/api/search")
    public PagedResponse<SearchResponse> search(
            @RequestParam Map<String, String> allParams) {

        int page = parseIntOrDefault(allParams.remove("page"), 0);
        int size = parseIntOrDefault(allParams.remove("size"), 20);

    
        Map<String, String> filters = new HashMap<>();
        allParams.forEach((k, v) -> { if (v != null && !v.isBlank()) filters.put(k, v); });

        return searchService.search(filters, page, size);
    }

  
    @GetMapping("/api/dropdown-options")
    public DropdownOptionsResponse getDropdownOptions() {
        return searchService.getDropdownOptions();
    }
    @GetMapping("/api/search/options")
    public DropdownOptionsResponse getDropdownOptionsLegacy() {
        return searchService.getDropdownOptions();
    }

    private int parseIntOrDefault(String val, int def) {
        try { return Integer.parseInt(val); } catch (Exception e) { return def; }
    }
}